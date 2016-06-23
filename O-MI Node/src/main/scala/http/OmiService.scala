/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 +    Copyright (c) 2015 Aalto University.                                        +
 +                                                                                +
 +    Licensed under the 4-clause BSD (the "License");                            +
 +    you may not use this file except in compliance with the License.            +
 +    You may obtain a copy of the License at top most directory of project.      +
 +                                                                                +
 +    Unless required by applicable law or agreed to in writing, software         +
 +    distributed under the License is distributed on an "AS IS" BASIS,           +
 +    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.    +
 +    See the License for the specific language governing permissions and         +
 +    limitations under the License.                                              +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

package http

import java.nio.file.{Files, Paths}

import scala.concurrent.duration._
import scala.concurrent.{Future, Promise}
import scala.xml.NodeSeq

import accessControl.AuthAPIService
import akka.actor.ActorSystem
import akka.http.scaladsl.marshallers.xml.ScalaXmlSupport
import akka.http.scaladsl.marshalling.PredefinedToResponseMarshallers._
import akka.http.scaladsl.marshalling.ToResponseMarshallable
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import http.Authorization._
import org.slf4j.LoggerFactory
import parsing.OmiParser
import responses.OmiGenerator._
import responses.{RequestHandler, Results}
import types.OmiTypes._
import types.Path

trait OmiServiceAuthorization
  extends ExtensibleAuthorization
     with LogPermissiveRequestBeginning // Log Permissive requests
     with IpAuthorization         // Write and Response requests for configured server IPs
     with SamlHttpHeaderAuth      // Write and Response requests for configured saml eduPersons
     with AllowNonPermissiveToAll // basic requests: Read, Sub, Cancel
     with AuthApiProvider         // Easier java api for authorization
     with LogUnauthorized         // Log everything else

/**
 * Actor that handles incoming http messages
 * @param reqHandler ActorRef that is used in subscription handling
 */
class OmiServiceImpl(reqHandler: RequestHandler)(implicit val system: ActorSystem)
     extends {
       // Early initializer needed (-- still doesn't seem to work)
       override val log = LoggerFactory.getLogger(classOf[OmiService])
  } with OmiService {

  registerApi(new AuthAPIService())

  //Used for O-MI subscriptions
  val requestHandler = reqHandler

}

/**
 * this trait defines our service behavior independently from the service actor
 */
trait OmiService
     extends CORSSupport
     with OmiServiceAuthorization
     {

  val system : ActorSystem
  import system.dispatcher
  def log: org.slf4j.Logger
  val requestHandler: RequestHandler


  //Get the files from the html directory; http://localhost:8080/html/form.html
  //this version words with 'sbt run' and 're-start' as well as the packaged version
  val staticHtml = if(Files.exists(Paths.get("./html"))){
    getFromDirectory("./html")
  } else getFromDirectory("O-MI Node/html")
  //val staticHtml = getFromResourceDirectory("html")


  /** Some trickery to extract the _decoded_ uri path: */
  def pathToString: Uri.Path => String = {
    case Uri.Path.Empty              => ""
    case Uri.Path.Slash(tail)        => "/"  + pathToString(tail)
    case Uri.Path.Segment(head, tail)=> head + pathToString(tail)
  }

  // Default to xml mediatype and require explicit type for html
  val htmlXml = ScalaXmlSupport.nodeSeqMarshaller(MediaTypes.`text/html`)
  implicit val xml = ScalaXmlSupport.nodeSeqMarshaller(MediaTypes.`text/xml`)

  // should be removed?
  val helloWorld = get {
     val document = { 
        <html>
        <body>
          <h1>Say hello to <i>O-MI Node service</i>!</h1>
          <ul>
            <li><a href="Objects">Url Data Discovery /Objects: Root of the hierarchy</a>
              <p>
                With url data discovery you can discover or request Objects,
                 InfoItems and values with HTTP Get request by giving some existing
                 path to the O-DF xml hierarchy.
              </p>
            </li>
            <li><a href="html/webclient/index.html">O-MI Test Client WebApp</a>
              <p>
                You can test O-MI requests here with the help of this webapp.
              </p>
            </li>
            <li><a href="html/ImplementationDetails.html">Implementation details, request-response examples</a>
              <p>
                Here you can view examples of the requests this project supports.
                These are tested against our server with <code>http.SystemTest</code>.
              </p>
            </li>
          </ul>
        </body>
        </html>
    }

    // XML is marshalled to `text/xml` by default
    complete(ToResponseMarshallable(document)(htmlXml))
  }

  val getDataDiscovery =
    path(Remaining) { uriPath =>
      get {
        // convert to our path type (we don't need very complicated functionality)
        val pathStr = uriPath // pathToString(uriPath)
        val path = Path(pathStr)

        requestHandler.generateODFREST(path) match {
          case Some(Left(value)) =>
            complete(value)
          case Some(Right(xmlData)) =>
            complete(xmlData)
          case None =>            {
            log.debug(s"Url Discovery fail: org: [$pathStr] parsed: [$path]")

            // TODO: Clean this code
            complete(
              ToResponseMarshallable(
              <error>No object found</error>
              )(
                fromToEntityMarshaller(StatusCodes.NotFound)(xml)
              )
            )
          }
        }
      }
    }

  def handleRequest(hasPermissionTest: PermissionTest, requestString: String): Future[NodeSeq] = {
    try {
      val eitherOmi = OmiParser.parse(requestString)
      eitherOmi match {
        case Right(requests) =>

          val ttlPromise = Promise[NodeSeq]()

          val request = requests.headOption  // TODO: Only one request per xml is supported currently
          val response = request match {

            case Some(originalReq : OmiRequest) =>
              hasPermissionTest(originalReq) match {
                case Some(req) =>{
                  req.ttl match{
                    case ttl: FiniteDuration => ttlPromise.completeWith(
                      akka.pattern.after(ttl, using = system.scheduler) {
                        log.info(s"TTL timed out after $ttl");
                        Future.successful(xmlFromResults(1.0, Results.timeOutError("ttl timed out")))
                      }
                    )
                    case _ => //noop
                  }
                  requestHandler.handleRequest(req)(system)
                }
                case None =>
                  Future.successful(unauthorized)
              }
            case _ => Future.successful(notImplemented)
          }

          //if timeoutfuture completes first then timeout is returned
          Future.firstCompletedOf(Seq(response, ttlPromise.future)) map { value =>

              // check the error code for logging
              if(value.\\("return").map(_.\@("returnCode")).exists(n=> n.size > 1 && n != "200")){
                log.warn(s"Errors with following request:\n${requestString}")
              }

              value // return
          }

        case Left(errors) => { // Errors found

          log.warn(s"${requestString}")
          log.warn("Parse Errors: {}", errors.mkString(", "))

          val errorResponse = parseError(errors.toSeq:_*)

          Future.successful(errorResponse)
        }
      }
    } catch {
      case ex: Throwable => { // Catch fatal errors for logging
        log.error("Fatal server error", ex)
        throw ex
      }
    }
  }


  /* Receives HTTP-POST directed to root */
  val postXMLRequest = post {// Handle POST requests from the client
    makePermissionTestFunction() { hasPermissionTest =>
      entity(as[String]) {requestString =>   // XML and O-MI parsed later
        complete(handleRequest(hasPermissionTest, requestString))
      }
    }
  }

  val postFormXMLRequest = post {
    makePermissionTestFunction() { hasPermissionTest =>
      formFields("msg".as[String]) {requestString =>
        complete(handleRequest(hasPermissionTest, requestString))
      }
    }
  }

  // Combine all handlers
  val myRoute = corsEnabled {
    path("") {
      postFormXMLRequest ~
      postXMLRequest ~
      helloWorld
    } ~
    pathPrefix("html") {
      staticHtml
    } ~
    pathPrefixTest("Objects") {
      getDataDiscovery
    }
  }
}

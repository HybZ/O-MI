package responses

import org.specs2.mutable._
import org.specs2.matcher.XmlMatchers._
import scala.io.Source
import responses._
import parsing._
import parsing.Types._
import parsing.Types.Path._
import parsing.Types.OmiTypes._
import database._
import parsing.OdfParser._
import java.util.{ Date, Calendar }
import java.text.SimpleDateFormat
import scala.xml.Utility.trim
import scala.xml.XML
import akka.actor._
import testHelpers.BeforeAfterAll
import scala.collection.JavaConversions.asJavaIterable
import scala.collection.JavaConversions.seqAsJavaList
import scala.collection.JavaConversions.iterableAsScalaIterable
import responses.RemoveSubscription

class SubscriptionHandlerTestActor extends Actor {
  def receive = {
    case RemoveSubscription(x) => {
      if (x <= 10) {
        sender() ! true
      } else {
        sender() ! false
      }
    }
    case _ => sender() ! false
  }
}

class TestSubHandler(testdb: DB) extends SubscriptionHandler {
  override implicit val dbConnection = testdb
}
class CancelTest extends Specification with BeforeAfterAll {
  sequential

  implicit val system = ActorSystem("on-core")

  val testdb: DB = new TestDB("cancel-test")
  implicit val dbConnection = testdb

  val subHandler = system.actorOf(Props(new TestSubHandler(testdb)), "subscription-handler")
  //  val OMICancel = new OMICancelGen(subHandler)
  val subscriptionHandler: ActorRef = system.actorOf(Props[SubscriptionHandlerTestActor]) //akka.testkit.TestProbe().ref//akka.actor.ActorRef.noSender
  val requestHandler = new RequestHandler(subscriptionHandler)(dbConnection)

  def beforeAll = {
    val calendar = Calendar.getInstance()
    calendar.setTime(new Date())
    calendar.set(Calendar.HOUR_OF_DAY, 12)
    val date = calendar.getTime
    val testtime = new java.sql.Timestamp(date.getTime)

    dbConnection.clearDB()
    val testData = Map(
      Path("Objects/CancelTest/Refrigerator123/PowerConsumption") -> "0.123",
      Path("Objects/ReadTest/Refrigerator123/RefrigeratorDoorOpenWarning") -> "door closed",
      Path("Objects/ReadTest/Refrigerator123/RefrigeratorProbeFault") -> "Nothing wrong with probe",
      Path("Objects/ReadTest/RoomSensors1/Temperature/Inside") -> "21.2",
      Path("Objects/ReadTest/RoomSensors1/CarbonDioxide") -> "too much",
      Path("Objects/ReadTest/RoomSensors1/Temperature/Outside") -> "12.2",
      Path("Objects/ReadTest/SmartCar/Fuel") -> "30")

    val singleSubs = Array(
      Path("Objects/CancelTest/Refrigerator123/PowerConsumption"),
      Path("Objects/ReadTest/Refrigerator123/RefrigeratorDoorOpenWarning"),
      Path("Objects/ReadTest/Refrigerator123/RefrigeratorProbeFault"),
      Path("Objects/ReadTest/RoomSensors1/Temperature/Inside"),
      Path("Objects/ReadTest/RoomSensors1/CarbonDioxide"),
      Path("Objects/ReadTest/RoomSensors1/Temperature/Outside"))

    val multiSubs = Array(
      singleSubs,
      Array(
        Path("Objects/ReadTest/RoomSensors1/Temperature/Inside"),
        Path("Objects/ReadTest/RoomSensors1/CarbonDioxide"),
        Path("Objects/ReadTest/RoomSensors1/Temperature/Outside")))

    for ((path, value) <- testData) {
      dbConnection.remove(path)
      dbConnection.set(new DBSensor(path, value, testtime))
    }

    // IDs [0-5]
    for (path <- singleSubs) {
      dbConnection.saveSub(new DBSub(Array(path), 0, 1, None, Some(testtime)))
    }

    // IDs [6-7]
    for (paths <- multiSubs) {
      dbConnection.saveSub(new DBSub(paths, 0, 1, None, Some(testtime)))
    }
  }

  def afterAll = {
    testdb.destroy()
  }

  "Cancel response" should {
    "Give correct XML when a single cancel is requested" in {
      lazy val simpletestfile = Source.fromFile("src/test/resources/responses/cancel/SimpleXMLCancelRequest.xml").getLines.mkString("\n")
      lazy val correctxmlreturn = XML.loadFile("src/test/resources/responses/cancel/SimpleXMLCancelReturn.xml")
      val parserlist = OmiParser.parse(simpletestfile)

      parserlist.isRight === true

      val resultXML = requestHandler.runGeneration(parserlist.right.get.head.asInstanceOf[CancelRequest])._1

      resultXML must beEqualToIgnoringSpace(correctxmlreturn)

      OmiParser.parse(resultXML.toString()) must beRight.which(_.headOption must beSome.which(_ should beAnInstanceOf[ResponseRequest]))
//      OmiParser.parse(resultXML.toString()).right.get.head should beAnInstanceOf[ResponseRequest]
    }

    "Give correct XML when a cancel with multiple ids are requested" in {
      lazy val simpletestfile = Source.fromFile("src/test/resources/responses/cancel/MultipleCancelRequest.xml").getLines.mkString("\n")
      lazy val correctxmlreturn = XML.loadFile("src/test/resources/responses/cancel/MultipleCancelReturn.xml")
      val parserlist = OmiParser.parse(simpletestfile)

      parserlist.isRight === true
      val resultXML = requestHandler.runGeneration(parserlist.right.get.head.asInstanceOf[CancelRequest])._1

      resultXML must beEqualToIgnoringSpace(correctxmlreturn)
      OmiParser.parse(resultXML.toString()) must beRight.which(_.headOption must beSome.which(_ should beAnInstanceOf[ResponseRequest]))
    }

    "Give correct XML when cancels with multiple paths is requested (multiple ids)" in {
      lazy val simpletestfile = Source.fromFile("src/test/resources/responses/cancel/MultiplePathsRequest.xml").getLines.mkString("\n")
      lazy val correctxmlreturn = XML.loadFile("src/test/resources/responses/cancel/MultiplePathsReturn.xml")
      val parserlist = OmiParser.parse(simpletestfile)
      parserlist.isRight === true
      val resultXML = requestHandler.runGeneration(parserlist.right.get.head.asInstanceOf[CancelRequest])._1

      resultXML must beEqualToIgnoringSpace(correctxmlreturn)
      OmiParser.parse(resultXML.toString()) must beRight.which(_.headOption must beSome.which(_ should beAnInstanceOf[ResponseRequest]))
    }

    "Give error XML when cancel is requested with non-existing id" in {
      lazy val simpletestfile = Source.fromFile("src/test/resources/responses/cancel/ErrorCancelRequest.xml").getLines.mkString("\n")
      lazy val correctxmlreturn = XML.loadFile("src/test/resources/responses/cancel/ErrorCancelReturn.xml")
      val parserlist = OmiParser.parse(simpletestfile)
      parserlist.isRight === true
      val resultXML = requestHandler.runGeneration(parserlist.right.get.head.asInstanceOf[CancelRequest])._1

      resultXML must beEqualToIgnoringSpace(correctxmlreturn)
      OmiParser.parse(resultXML.toString()) must beRight.which(_.headOption must beSome.which(_ should beAnInstanceOf[ResponseRequest]))
    }

    "Give correct XML when valid and invalid ids are mixed in cancel request" in {
      lazy val simpletestfile = Source.fromFile("src/test/resources/responses/cancel/MixedCancelRequest.xml").getLines.mkString("\n")
      lazy val correctxmlreturn = XML.loadFile("src/test/resources/responses/cancel/MixedCancelReturn.xml")
      val parserlist = OmiParser.parse(simpletestfile)
      parserlist.isRight === true
      val resultXML = requestHandler.runGeneration(parserlist.right.get.head.asInstanceOf[CancelRequest])._1

      resultXML must beEqualToIgnoringSpace(correctxmlreturn)
      OmiParser.parse(resultXML.toString()) must beRight.which(_.headOption must beSome.which(_ should beAnInstanceOf[ResponseRequest]))
    }
  }
}

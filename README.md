O-MI Node Server
[![Latest release](https://img.shields.io/github/release/AaltoAsia/O-MI.svg)](https://github.com/AaltoAsia/O-MI/releases/latest)
[![Build Status](https://travis-ci.org/AaltoAsia/O-MI.svg?branch=master)](https://travis-ci.org/AaltoAsia/O-MI)
[![Coverage Status](https://coveralls.io/repos/AaltoAsia/O-MI/badge.svg?branch=master&service=github)](https://coveralls.io/github/AaltoAsia/O-MI?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/9f49209c70e24c67bbc1826fde507518)](https://www.codacy.com/app/TK009/O-MI?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=AaltoAsia/O-MI&amp;utm_campaign=Badge_Grade)
[![Join the chat at https://gitter.im/AaltoAsia/O-MI](https://badges.gitter.im/AaltoAsia/O-MI.svg)](https://gitter.im/AaltoAsia/O-MI?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
==============


<!-- Not resizable at the moment:
![O-MI Logo](https://cdn.rawgit.com/AaltoAsia/O-MI/3a3b3192/O-MI%20Node/html/0-MI.svg)
![O-DF Logo](https://cdn.rawgit.com/AaltoAsia/O-MI/3a3b3192/O-MI%20Node/html/0-DF.svg)
-->
<img src="https://cdn.rawgit.com/AaltoAsia/O-MI/3a3b3192/O-MI%20Node/html/0-MI.svg" height=100 /><img src="https://cdn.rawgit.com/AaltoAsia/O-MI/3a3b3192/O-MI%20Node/html/0-DF.svg" height=100 />


Internet of Things data server.
Implementation of O-MI Node as specified in [Open Messaging Interface](http://www.opengroup.org/iot/omi/index.htm) ([pdf](https://www2.opengroup.org/ogsys/catalog/C14B)) v1.0 standard with [Open Data Format](http://www.opengroup.org/iot/odf/index.htm) ([pdf](https://www2.opengroup.org/ogsys/catalog/C14A)) standard. It is intended to be as reference implementation that shows how these standards work in more detail. Missing features and differences to the standard are collected to [this](https://docs.google.com/spreadsheets/d/1duj-cX7dL9QR0igVMLNq9cBytSA196Ogiby-MWMetGw/edit?pref=2&pli=1#gid=1927687927) (work in progress) document. Questions or problems with the server or the standards can be posted to [Issues](https://github.com/AaltoAsia/O-MI/issues), email or [gitter chat](https://gitter.im/AaltoAsia/O-MI?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge).

Supported communication protocols:

* HTTP (`http://`)
* HTTPS (`https://`)
* [WebSocket](#o-mi-extensions) (`ws://`)
* WebSocket Secure (`wss://`)

This project also includes:

* a developer webapp for building and sending O-MI/O-DF messages.
* some experimental extensions for the server which can be found in other branches:
  - `omisec-omi-interface` has O-MI/O-DF interface for authorization of O-MI messages in external service.
  - `warp10integration` has integration to [Warp10](http://www.warp10.io/) as the DB backend.

See `development` branch for latest progress.

Chat with dev team: [![Join the chat at https://gitter.im/AaltoAsia/O-MI](https://badges.gitter.im/AaltoAsia/O-MI.svg)](https://gitter.im/AaltoAsia/O-MI?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


Resources
---------

* [O-MI Specification (html)](http://www.opengroup.org/iot/omi/index.htm)
* [O-DF Specification (html)](http://www.opengroup.org/iot/odf/index.htm)
* [API Documentation ScalaDoc](https://otaniemi3d.cs.hut.fi/omi/node/html/api/index.html)
* [API Documentation JavaDoc](https://otaniemi3d.cs.hut.fi/omi/node/html/api/java/index.html)
* [Examples of requests and responses, as handled by this server](https://otaniemi3d.cs.hut.fi/omi/node/html/ImplementationDetails.html)
* [Technical Documentation (outdated)](https://drive.google.com/folderview?id=0B85FeC7Xf_sSfm9yNnFwTEQxclFCT2s3MUdDd1czWmFCM2FEQjIxTHRHU2xtT2NXUzJNR0U&usp=sharing)



Dependencies
------------
* Java 1.8
* For building: SBT (Simple Build Tool) http://www.scala-sbt.org/ or SBT enabled IDE

Running
-------
[Download the pre-compiled zip, tgz or debian package from latest git releases here](https://github.com/AaltoAsia/O-MI/releases/latest). [![Latest release](https://img.shields.io/github/release/AaltoAsia/O-MI.svg)](https://github.com/AaltoAsia/O-MI/releases/latest)

Extract the zip file and navigate to the /bin directory
To run O-MI Node run the corresponding startup script from the bin directory for your OS:

* `bin/o-mi-node.bat` for Windows
* `bin/o-mi-node` for Unix and Mac

This will run O-MI Node with configuration in `/conf/application.conf`.
By default it will start at url [http://localhost:8080/](http://localhost:8080/) and has some example and demo agents.
More Information in the [Configuration](#Configuration) section.

Compiling and packaging
-----------------------
1. Follow the instructions 1-4 in [Setup development environment](#setup-development-environment) below
2. run `sbt release`
3. Result can be found in `./target/universal/o-mi-Node-version.zip`


See [SBT Universal Plugin](http://www.scala-sbt.org/sbt-native-packager/formats/universal.html)
for more packaging methods.

<!--- Currently not supported
  Compiling a jar
  ---------------

  1. Follow the instructions 1-4 in [Setup development environment](#setup-development-environment) below
  2. `sbt one-jar`
  3. Result can be found in `./target/scala-2.11/o-mi-node_2.11-0.1-SNAPSHOT-one-jar.jar`

--->

Setup development environment
-----------------------------

1. `git clone`
2. [Install sbt](http://www.scala-sbt.org/0.13/tutorial/Setup.html)
3. (windows: logout, or put sbt into PATH yourself)
4. Open a cmd or shell to the `O-MI` project directory
5. Then run `sbt` and in opened the ">" prompt run `re-start` to compile and run the Node
6. Visit http://localhost:8080/ to see that it's working

You can check the [Simple Build Tool cheat sheet](#simple-build-tool-cheat-sheet) section to learn more

### Setting up IDE

* IntelliJ IDEA
   1. Install the IDE
      1. Download and install IntelliJ IDEA
      2. When running for the first time install Scala from the 'Featured plugins' tab (you can also install Scala plugin later from Settings/plugins)
      3. Open the IDE
   2. Import the project
      1. Select import project -> select `O-MI` directory and click OK
      2. Select import project from external model and select `SBT` and then click Next
      3. For the 'Project JDK' select 'New...' and select JDK and then locate your JDK 1.8 folder and select it and click Finish
      4. When prompted to select modules to include in the project, select: root, agents and omiNode and then click OK
      5. Wait for the IDE to finish indexing the files (might take a few minutes)
* Eclipse
   1. Run `sbt eclipse`
   2. Open Eclipse IDE
   3. Select File->import `Existing Projects into Workspace`


Simple Build Tool cheat sheet
-----------------------------

Native SBT commands

- `sbt compile`: just compile the project
- `sbt clean`: remove compiled and temporary files
- `sbt run`: run the project; We don't use this much, so sometimes it's broken and we don't even notice. We use `re-start` from Revolver which allows us to recompile and restart the node without exiting sbt, because restarting sbt takes unnecessary extra time.
- `sbt doc`: compile api documentation
- `sbt test`: run all tests

Extra commands from plugins and other

- We use sbt-revolver: run `sbt` and then write
    - `re-start`: compile&run the project in background
    - `re-stop`: close the background process
- We use sbt-native-packager:
    - `sbt stage`: creates file structure, used in packaged version, to the `./target/universal/stage/` directory
    - `sbt debian:packageBin`: create release debian package (requires `dpkg` program installed)
    - See native packager docs for configuring other packages. Our sbt configuration is in ./build.sbt.
- We use sbt-scoverage:
    - `sbt clean coverage test coverageReport`: calculate test coverage and generate reports in `O-MI-Node/target/scala-2.11/scoverage-report/`   
- We also have some extra commands for convenience:
    - `sbt systemTest`: run only system tests (the used requests and responses can be found in `ImplementationDetails.html`)
    - `sbt release`: create release tar and zip packages
    
_extra info:_

- automatically run any of above commands when there is a file change by adding `~` in front, like `sbt ~re-start`
- all commands above compiles the needed files that are not yet compiled
- run many commands in sequence faster if you open a single sbt command line with `sbt`




Configuration
=============

Basic configuration
-------------------

See [reference.conf](https://github.com/AaltoAsia/O-MI/blob/master/O-MI-Node/src/main/resources/reference.conf)
for the defaults and configuration documentation.

### Configuration Location

* In package releases: `/etc/o-mi-node/application.conf`
* In tar and zip releases: `./conf/application.conf`
* In development environment: `./O-MI-Node/src/main/resources/application.conf` (create a new file if not found)


Library Config
--------------

`application.conf` can also have a lot of Akka (threading framework and HTTP server) and Slick (database) specific settings:

- [Akka Actors](http://doc.akka.io/docs/akka/2.3.9/general/configuration.html)
- [Akka HTTP](http://doc.akka.io/docs/akka-http/10.0.9/scala/http/configuration.html)
- [Slick forConfig docs](http://slick.typesafe.com/doc/3.0.0-RC2/api/index.html#slick.jdbc.JdbcBackend$DatabaseFactoryDef@forConfig\(String,Config,Driver\):Database)

O-MI Extensions
===============

This server supports the following extensions to O-MI v1.0:

1. Websockets
  * Client can initiate websocket connection to O-MI Node server by connecting to the same root path as POST requests with http connection upgrade request. (url conventions: `ws://` or secure `wss://`)
  * During a websocket connection the server accepts requests as in normal http communication. Immediate responses are sent in the same order as the corresponding requests were received.
  * During a websocket connection callback can be set to `"0"` in an O-MI message to tell O-MI Node to use current websocket connection as the callback target.
  * Keep in mind that depending on client and server configuration, a websocket connection will timeout if there is long period of inactivity. (Default is usually 1 minute). No callbacks can be sent after a timeout occurs (as websockets are always initiated by a client).
    - If your ws client library doesn't support the native ws ping, sending an empty websocket message is allowed for the purpose of keeping the connection alive and server will not send any special response for that.
2. Delete operation
  * Delete operation is currently an extension until it is released in O-MI standard version 2.0

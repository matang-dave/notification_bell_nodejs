This project uses node server that runs on port 8080. Use this link to open the site: 127.0.0.1:8080


Things required to run the server:
node.js
npm package manager
mysql server

In order to add all the npm packages open terminal in this folder and run nmp install. This will load all the packages present in package.json.

After the packages are loaded use this command node server.js to run the server.

db folder contains the mysql database in the file named notfication_db_schema.sql.
Create database named notfication_db in mysql and export the above mentioned file.

config.js contains all the details about db connection and time interval at which random msg will be inserted in notification table.


This system contains sign-in and sign-up of the user. After the user creates an account system will start generating random msg pointing to the user.

System uses web socket for push notification and if it is not available on the user browser start pull data from the server at an interval
5(AJAX_TIMER) seconds defined in the public file notification_manager.js in app folder
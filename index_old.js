/*'use strict'*/

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const qs = require('querystring')
const fs = require('fs')
const https = require('https')
const http = require('http')

const app = express()

var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID

var url = 'mongodb://52.34.226.223:27017/cs_bot'

app.set('port', (process.env.PORT || 5001))

var options	= {
	key: fs.readFileSync('ssl_cert/private.key'),
	ca: fs.readFileSync('ssl_cert/ca_bundle.crt'),
	cert: fs.readFileSync('ssl_cert/certificate.crt')
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

var server = https.createServer(options, app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
})

// index
app.get('/', function (req, res) {
	res.send('Career Sensy Fb Bot Server Started')
})


// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
	var messaging_events = req.body.entry[0].messaging
	for (var i = 0; i < messaging_events.length; i++) {
		var event = req.body.entry[0].messaging[i]
		var sender = event.sender.id
		console.log('Sender : '+sender+' |||||||||||||||||||||||||||||||||||||||||||||||||')
		authUser(sender, event)
	}
	res.sendStatus(200)
})


// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.FB_PAGE_ACCESS_TOKEN
const token = "EAADaZCeOTsPUBAOb6kMcd0n8k6WLZBzgA89rrT9FzTZAb81Bq0rnD1efbCAQDOHg4jXY15QeGZAZCSNUoQbEZBwAn8ov06JgXoIVq9TbkcbUcO871ZABSlMrBNLnq2kEKxU2qBnJ3qzZBiR0qu4MkJ4WBz2KpqyQjlawMKPUReG0LAZDZD"

function authUser(sender, event){
	MongoClient.connect(url, function(err, db) {
	  	var cursor = db.collection('fb_user_profile').find({ "fb_id": parseInt(sender) }).toArray(function(err, res){
	   	if(res.length != 0){
            eventHandle(sender, event)
         }else{
            request("https://graph.facebook.com/v2.6/"+sender+"?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token="+token, function(error, response, body) {
               //console.log(JSON.stringify(body))
               var data = JSON.parse(body)
               if(data.error){
                  sendTextMessage(sender, 'Error authenticating', 'error')
               }else{
                  var cursor = db.collection('fb_user_profile').insertOne({
                     "first_name": data.first_name,
                     "last_name": data.last_name,
                     "profile_pic": data.profile_pic,
                     "locale": data.locale,
                     "timezone": data.timezone,
                     "gender": data.gender,
                     "username": "",
                     "email": "",
                     "mobile": "",
                     "fb_id": parseInt(sender),
                     "time_stamp": Date.now(),
                     "score": {
                     	"R": 0,
                     	"I": 0,
                     	"A": 0,
                     	"S": 0,
                     	"E": 0,
                     	"C": 0
                     }
                  }, function(err){
                     if(err){
                       sendTextMessage(sender, 'Error authenticating', 'error')
                    }else{
                       eventHandle(sender, event)
                    }
                  })
               }
            })
         }
	   })
	})
}

function eventHandle(sender, event){
	MongoClient.connect(url, function(err, db) {
	  	var cursor = db.collection('fb_user_profile').find({ "fb_id": parseInt(sender) }).toArray(function(err, res){
			if (event.message && event.message.quick_reply){
				var text = event.message.quick_reply.payload

				if(text === 'YO'){
					/*var msgData = { text: 'Here it goes :-)'}*/
					request("http://52.34.226.223:8008/next_response/"+sender+'/YO', function(error, response, body) {
					  var resp = body
					  var a = JSON.parse(resp)

					  //var msgData = { text: a.response }
					  var msgData = {
							"text": a.response,
						    "quick_replies":[
						      {
						        "content_type":"text",
						        "title":"Yes",
						        "payload":"POS"
						      },{
						        "content_type":"text",
						        "title":"Nope",
						        "payload":"NEG"
						      },{
						        "content_type":"text",
						        "title":"Can't Say",
						        "payload":"NEU"
						      }

						    ]
						}

					  var sent_msg = text.replace(/\//g, "").toLowerCase()
					  var received_msg = msgData.text
					  var msg_cat = a.msg_cat
					  var time_stamp = Date.now()

					  sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					  
					})
					/*sendPostbackMessage(sender, msgData, 'YO', text.substring(0, 200))*/
				}else if(text === 'NO'){
					var msgData = { text: 'Yo can type help to get started'}
					sendPostbackMessage(sender, msgData, 'NO', text.substring(0, 200))
				}else if(text === 'POS'){
					console.log('POS Clicked ||||||||||||||||||||||||||||')
					request("http://52.34.226.223:8008/next_response/"+sender+'/POS', function(error, response, body) {
					  var resp = body
					  var a = JSON.parse(resp)

					  //var msgData = { text: a.response }
					  var msgData = {
							"text": a.response,
						    "quick_replies":[
						      {
						        "content_type":"text",
						        "title":"Yes",
						        "payload":"POS"
						      },{
						        "content_type":"text",
						        "title":"Nope",
						        "payload":"NEG"
						      },{
						        "content_type":"text",
						        "title":"Can't Say",
						        "payload":"NEU"
						      }

						    ]
						}

					  var sent_msg = text.replace(/\//g, "").toLowerCase()
					  var received_msg = msgData.text
					  var msg_cat = a.msg_cat
					  var time_stamp = Date.now()

					  sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					  
					})
				}else if(text === 'NEG'){
					console.log('NEG Clicked ||||||||||||||||||||||||||||')
					request("http://52.34.226.223:8008/next_response/"+sender+'/NEG', function(error, response, body) {
					  var resp = body
					  var a = JSON.parse(resp)

					  //var msgData = { text: a.response }
					  var msgData = {
							"text": a.response,
						    "quick_replies":[
						      {
						        "content_type":"text",
						        "title":"Yes",
						        "payload":"POS"
						      },{
						        "content_type":"text",
						        "title":"Nope",
						        "payload":"NEG"
						      },{
						        "content_type":"text",
						        "title":"Can't Say",
						        "payload":"NEU"
						      }

						    ]
						}

					  var sent_msg = text.replace(/\//g, "").toLowerCase()
					  var received_msg = msgData.text
					  var msg_cat = a.msg_cat
					  var time_stamp = Date.now()

					  sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					  
					})
				}else if(text === 'NEU'){
					console.log('NEU Clicked ||||||||||||||||||||||||||||')
					request("http://52.34.226.223:8008/next_response/"+sender+'/NEU', function(error, response, body) {
					  var resp = body
					  var a = JSON.parse(resp)

					  //var msgData = { text: a.response }
					  var msgData = {
							"text": a.response,
						    "quick_replies":[
						      {
						        "content_type":"text",
						        "title":"Yes",
						        "payload":"POS"
						      },{
						        "content_type":"text",
						        "title":"Nope",
						        "payload":"NEG"
						      },{
						        "content_type":"text",
						        "title":"Can't Say",
						        "payload":"NEU"
						      }

						    ]
						}

					  var sent_msg = text.replace(/\//g, "").toLowerCase()
					  var received_msg = msgData.text
					  var msg_cat = a.msg_cat
					  var time_stamp = Date.now()

					  sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					  
					})
				}

			}else if (event.message && event.message.text) {
				var text = event.message.text
				
				if(text.toLowerCase() == 'hello' || text.toLowerCase() == 'hi' || text.toLowerCase() == 'hey' || text.toLowerCase() == 'hy' || text.toLowerCase() == 'yo' || text.toLowerCase() == 'hey medy'){
					var msgData = {
						"attachment":{
					      "type":"template",
					      "payload":{
					        "template_type":"button",
					        "text":'Hey '+res[0].first_name+'!! Glad to see you here, would keep you updated on our launch.. See you soon. :-)',
					        "buttons":[
					          {
					            "type":"web_url",
					            "url":"http://.careersensy.com",
					            "title":"Visit Website"
					          }
					        ]
					      }
					    }
					  }

					var sent_msg = text.toLowerCase()
					var received_msg = msgData.text
					var msg_cat = 'intro'
					var time_stamp = Date.now()
					sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
				}else if(text.toLowerCase() == 'help'){
					var msgData = {
						"text":"Hey "+res[0].first_name+"!! CS is here to help you decide best career opportunities. Let's get started :-D",
					    "quick_replies":[
					      {
					        "content_type":"text",
					        "title":"Yo",
					        "payload":"YO"
					      },{
					        "content_type":"text",
					        "title":"No",
					        "payload":"NO"
					      }
					    ]
					}
					sendPostbackMessage(sender, msgData, 'GS', text.substring(0, 200))
				}else if(text.toLowerCase() == 'my status' || text.toLowerCase() == 'status' || text.toLowerCase() == 'what is my status now'){
					request("http://52.34.226.223:8008/threshold/"+sender, function(error, response, body) {
					  var a = JSON.parse(body)
					  var msgData = {}
					  if(a.status == 'false'){
					  	msgData = {
							"text":"Let's interact little more",
						    "quick_replies":[
						      {
						        "content_type":"text",
						        "title":"Continue",
						        "payload":"NEU"
						      }
						    ]
						}
					  }else{
					  	msgData = { text: a.holland }
					  }
					  

					  var sent_msg = "my status"
					  var received_msg = msgData.text
					  var msg_cat = 'holland'
					  var time_stamp = Date.now()

					  sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					  
					})
				}else{
					/*var msgData = {
						"attachment":{
					      "type":"template",
					      "payload":{
					        "template_type":"button",
					        "text":"Will talk to you once my system is ready and I am stubborn on it.. :-D",
					        "buttons":[
					          {
					            "type":"web_url",
					            "url":"http://careersensy.com",
					            "title":"Visit Website"
					          }
					        ]
					      }
					    }
					  }
					var sent_msg = text.toLowerCase()
					var received_msg = msgData.text
					var msg_cat = 'bull_shit'
					var time_stamp = Date.now()
					sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)*/
					request("http://52.34.226.223:8008/bot_response/"+qs.escape(text.replace(/\//g, " ")), function(error, response, body) {
					  var resp = body
					  var a = JSON.parse(resp)

					  var msgData = { text: a.response }

					  var sent_msg = text.replace(/\//g, "").toLowerCase()
					  var received_msg = msgData.text
					  var msg_cat = 'NLP'
					  var time_stamp = Date.now()

					  sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					  
					})
				}

			}else if (event.postback) {
				var text = event.postback.payload
				/*var msgData = { text: 'Hey '+res[0].first_name+'!!'}*/
				var msgData = {
					"text":"Hey "+res[0].first_name+"!! CS is here to help you decide best career opportunities. Let's get started :-D",
				    "quick_replies":[
				      {
				        "content_type":"text",
				        "title":"Yo",
				        "payload":"YO"
				      },{
				        "content_type":"text",
				        "title":"No",
				        "payload":"NO"
				      }
				    ]
				}
				sendPostbackMessage(sender, msgData, 'GS', text.substring(0, 200))
			}
		})
	})
}

function sendPostbackMessage(sender, msgData, m_cat, text){
	var mData = msgData
	var sent_msg = text.toLowerCase()
	var received_msg = msgData.text
	var msg_cat = m_cat
	var time_stamp = Date.now()
	sendMessage(sender, mData, sent_msg, received_msg, msg_cat, time_stamp)
}

function sendTextMessage(sender, text, msgType) {
	var messageData = { text:text }
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}else{
			insertLog(sender, text, text, '', Date.now())
		}
	})
}

function sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp){

	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: msgData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}else{
			insertLog(sender, sent_msg, received_msg, msg_cat, time_stamp)
		}
	})
}

function insertLog(sender, sent_msg, received_msg, msg_cat, time_stamp){
	MongoClient.connect(url, function(err, db) {
		var cursor = db.collection('fb_msg_log').insertOne({
			"fb_id": parseInt(sender),
			"sent_msg": sent_msg,
			"received_msg": received_msg,
			"msg_cat": msg_cat,
			"timestamp": time_stamp
		}, function(err){
			if(err){
				console.log('Error logging message')
			}
		})
	})
}
/* ======================================================================================== */

/*app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})*/

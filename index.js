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

var url = 'mongodb://52.34.226.223:27017/th_bot'

app.set('port', (process.env.PORT || 5002))

var options	= {
	key: fs.readFileSync('ssl_cert/private.key'),
	ca: fs.readFileSync('ssl_cert/ca_bundle.crt'),
	cert: fs.readFileSync('ssl_cert/certificate.crt')
}

app.use(bodyParser.urlencoded({extended: false}))

app.use(bodyParser.json())

var server = https.createServer(options, app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
})

app.get('/', function (req, res) {
	res.send('Target Hack Fb Bot Server Started')
})

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
		console.log(JSON.stringify(event))
		var sender = event.sender.id
		console.log('Sender : '+sender+' |||||||||||||||||||||||||||||||||||||||||||||||||')
		authUser(sender, event)
	}
	res.sendStatus(200)
})


const token = "EAAaDbccyVA4BAJtqxozyiVvDKYtz67jTGbHH1ity8pKRwcZB03bXOyEXgpFBama34rNAiaMQK8t6ZA9smGQhKsTtznvZCqbIgWVp4HVQQZCPiZC3Jn4xMr0DqH7ZAFRFG1Yxt43JIsnKE1QDc2sq6W7lAdazwSWuKUWesCzZCCizwZDZD"

function authUser(sender, event){
	MongoClient.connect(url, function(err, db) {
	  	var cursor = db.collection('fb_user_profile').find({ "fb_id": parseInt(sender) }).toArray(function(err, res){
	   	if(res.length != 0){
            eventHandle(sender, event)
         }else{
            request("https://graph.facebook.com/v2.6/"+sender+"?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token="+token, function(error, response, body) {

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
                     "time_stamp": Date.now()
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
				// body goes here

			}else if (event.message && event.message.text) {
				var text = event.message.text

				var a = text.split(' ')

				if(a[a.length - 4] == 'at'){
					var msgData = { text: "Will remind you "+res[0].first_name+" :-)"}
					var sent_msg = text
					var received_msg = msgData.text
					var msg_cat = 'to-do'
					var time_stamp = Date.now()

					sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
				}else if(text.toLowerCase() == 'my calendar'){
					console.log('My Calendar !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
					var cursor = db.collection('fb_msg_log').find({ "fb_id": parseInt(sender), "msg_cat": "to-do" }).toArray(function(err, res){

						var res_str = ''

					  	for(var i=0; i<res.length; i++ ){
					  		res_str +=	res[i].sent_msg+'\n'
					  	}

					  	var msgData = { text: res_str}
					  	var sent_msg = text
						var received_msg = 'to-do list'
						var msg_cat = 'to-do list'
						var time_stamp = Date.now()

						sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					})
				}else if(text.toLowerCase() == 'suggest me some hoodies'){
					var msgData = {
					  "attachment": {
					    "type": "template",
					    "payload": {
					      "template_type": "generic",
					      "elements": [
					        {
					          "buttons": [
					            {
					              "payload": "JACK",
					              "type": "postback",
					              "title": "Get Details"
					            },
					            {
					              "payload": "BUY",
					              "type": "postback",
					              "title": "Buy Now"
					            }
					          ],
					          "image_url": "http://papini.co.uk/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/g/r/greynavy_hoodie.jpg",
					          "subtitle": "Description Of the product",
					          "title": "Hoodie 1"
					        },
					        {
					          "buttons": [
					            {
					              "payload": "JACK",
					              "type": "postback",
					              "title": "Get Details"
					            },
					            {
					              "payload": "BUY",
					              "type": "postback",
					              "title": "Buy Now"
					            }
					          ],
					          "image_url": "http://scene7.zumiez.com/is/image/zumiez/pdp_hero/RipNDip-We-Out-Here-Black-Hoodie-_270780-front.jpg",
					          "subtitle": "Description Of the product",
					          "title": "Hoodie 2"
					        }
					      ]
					    }
					  }
					}
					var sent_msg = text
					var received_msg = 'list'
					var msg_cat = 'test'
					var time_stamp = Date.now()

					sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
				}else if(text.toLowerCase() == 'i need groceries'){
					var msgData = {
					  "attachment": {
					    "type": "template",
					    "payload": {
					      "template_type": "generic",
					      "elements": [
					        {
					          "buttons": [
					            {
					              "payload": "ITEM",
					              "type": "postback",
					              "title": "Get Details"
					            },
					            {
					              "payload": "ATC",
					              "type": "postback",
					              "title": "Add to cart"
					            }
					          ],
					          "image_url": "http://www.bigbasket.com/media/uploads/p/s/279836_6-24-mantra-organic-rice-sonamasuri-white.jpg",
					          "subtitle": "Description Of the product",
					          "title": "Item 1"
					        },
					        {
					          "buttons": [
					            {
					              "payload": "ITEM",
					              "type": "postback",
					              "title": "Get Details"
					            },
					            {
					              "payload": "ATC",
					              "type": "postback",
					              "title": "Add to cart"
					            }
					          ],
					          "image_url": "http://www.bigbasket.com/media/uploads/p/s/40020127_4-fresho-aloo-mutter.jpg",
					          "subtitle": "Description Of the product",
					          "title": "Item 2"
					        }
					      ]
					    }
					  }
					}
					var sent_msg = text
					var received_msg = 'list'
					var msg_cat = 'groceries'
					var time_stamp = Date.now()

					sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
				}else{
					request("http://52.34.226.223:8008/bot_response/"+qs.escape(text.replace(/\//g, " ")), function(error, response, body) {
					  var a = JSON.parse(body)

					  var msgData = {}

					  if(a.status == 'OK'){
					  	msgData = { text: a.response}
					  }else{
					  	msgData = { text: "Something went wrong :-("}
					  }

					  var sent_msg = text.replace(/\//g, "").toLowerCase()
					  var received_msg = msgData.text
					  var msg_cat = a.msg_cat
					  var time_stamp = Date.now()

					  sendMessage(sender, msgData, sent_msg, received_msg, msg_cat, time_stamp)
					  
					})
				}
									

			}else if (event.postback) {
				var text = event.postback.payload				
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
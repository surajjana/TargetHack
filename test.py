import json
import requests

fd = open('jobs.json', 'r')
data = json.load(fd)

for i in range(27, 29):
	for j in range(0, len(data[i]['jobs'])):
		img = requests.get('http://localhost:8000/get_img/'+data[i]['jobs'][j]['val'])

		img_url = json.loads(img.text)

		data[i]['jobs'][j].update({"img_url": img_url['img_url']})

	print i

print json.dumps(data[26:])
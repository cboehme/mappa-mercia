from gdata import service as gservice
import gdata
import atom

service = gservice.GDataService()
service.service = "blogger"
service.account_type = "GOOGLE"
service.server = "www.blogger.com"

feed = service.GetFeed("/feeds/785938049589922873/posts/default")
print feed.title.text
for entry in feed.entry:
	if entry.title.text:
		print "\t" + entry.title.text
	else:
		print "ERROR: entry.title.text is None"
	print entry.content.text
print

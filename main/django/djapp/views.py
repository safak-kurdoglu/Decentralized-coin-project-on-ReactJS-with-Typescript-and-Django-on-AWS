from django.http import JsonResponse, HttpResponse
from djapp.models import Nodes, Wallets
from django.core import serializers
import json
import requests

def newNode(request): 
    try:
        if request.method == "POST":
            params = json.loads(request.body)
            if Nodes.objects.raw("SELECT uri FROM djapp_nodes WHERE djapp_nodes.uri = '%s'" % params['uri']):
                return HttpResponse(json.dumps({"status":False, "message":"You are already in the network."}))
            else: 
                nodesModel = Nodes.objects.all()
                nodes = serializers.serialize('json', nodesModel)
                newNode = Nodes(uri=params['uri'], x=params['x'], y=params['y'])
                newNode.save()
                return HttpResponse(json.dumps({"status":True, "nodes": nodes}))
        #else  
    except Exception as e:
        error = str(e)
        return HttpResponse({error}, status=500) 
  

def checkConnection(request):
    try:
        if request.method == "POST":
            params = json.loads(request.body)
            if Nodes.objects.raw("SELECT uri FROM djapp_nodes WHERE djapp_nodes.uri = '%s'" % params['uri']):
                return HttpResponse(json.dumps({"status":True}))
            else:
                return HttpResponse(json.dumps({"status":False, "message":"You are offline."}))
        #else 
    except Exception as e: 
        error = str(e)
        return HttpResponse({error}, status=500) 


def sendNodes(request):
    try:
        nodesModel = Nodes.objects.all()
        nodes = serializers.serialize('json', nodesModel)
        return HttpResponse({nodes})
    except Exception as e:
        error = str(e)
        return HttpResponse({error}, status=500)

def newWallet(request):
    try:
        if request.method == "POST":
            params = json.loads(request.body)
            if Wallets.objects.raw("SELECT username FROM djapp_wallets WHERE djapp_wallets.username = '%s'" % params['username']):
                return HttpResponse(json.dumps({"status": False, "message": "Username has been taken."}))
            else:
                newWallet = Wallets(username=params['username'], key=params['key'], transactionnum=0)
                newWallet.save()
                return HttpResponse(json.dumps({"status":True}))
        #else
    except Exception as e:
        error = str(e)
        return HttpResponse({error}, status=500)

def getKey(request):
    try:
        if request.method == "POST":
            params = json.loads(request.body)
            wallet = Wallets.objects.raw("SELECT username, key FROM djapp_wallets WHERE djapp_wallets.username = '%s'" % params['username'])
            if wallet:
                return HttpResponse(json.dumps({"status": True, "key": wallet[0].key}))
            else:
                return HttpResponse(json.dumps({"status": False, "message": "Wallet is not exist."}))  
        else:
            return HttpResponse({"Http method "+request.method+" is not allowed. Accepted method is POST."}, status=405)
    except Exception as e:
        error = str(e)
        return HttpResponse({error}, status=500)

def getWalletData(request):
    try:
        if request.method == "POST":
            params = json.loads(request.body)
            wallet = Wallets.objects.raw("SELECT * FROM djapp_wallets WHERE djapp_wallets.username = '%s'" % params['username'])
            if wallet:
                return HttpResponse(json.dumps({"status": True, "key": wallet[0].key, "transactionNum": wallet[0].transactionnum}))
            else:
                return HttpResponse(json.dumps({"status": False, "message": "Something went wrong."}))  
        else:
            return HttpResponse({"Http method "+request.method+" is not allowed. Accepted method is POST."}, status=405)
    except Exception as e:
        error = str(e)
        return HttpResponse({error}, status=500)

def updateTransactionNum(request):
    try:
        if request.method == "PUT":
            params = json.loads(request.body)
            wallet = Wallets.objects.raw("SELECT username, transactionnum FROM djapp_wallets WHERE djapp_wallets.username = '%s'" % params['username'])
            wallet[0].transactionnum += 1
            wallet[0].save()
            return HttpResponse()
        else:
            return HttpResponse({"Http method "+request.method+" is not allowed. Accepted method is POST."}, status=405)
    except Exception as e:
        error = str(e)
        return HttpResponse({error}, status=500)


def connectionConsensus(request):
    nodes = Nodes.objects.all()
    for node in nodes: 
        try:
            r = requests.get(node.uri+"/check-connection")
        except:
            deleteOfflineNode(node.uri)
    return HttpResponse(json.dumps({"status":True}))


def deleteOfflineNode(uri):
    Nodes.objects.filter(uri=uri).delete()
    return

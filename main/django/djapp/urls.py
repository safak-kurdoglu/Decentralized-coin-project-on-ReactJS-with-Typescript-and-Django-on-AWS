
from django.urls import path

from . import views

urlpatterns = [ 
   path('new-node', views.newNode, name='newNode'),
   path('check-connection', views.checkConnection),
   path('send-nodes', views.sendNodes),
   path('new-wallet', views.newWallet),
   path('get-wallet-key', views.getKey),
   path('get-wallet-data', views.getWalletData),
   path('update-transaction-num', views.updateTransactionNum),
   path('connection-consensus', views.connectionConsensus),
] 
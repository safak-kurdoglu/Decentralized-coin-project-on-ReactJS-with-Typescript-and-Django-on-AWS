from django.db import models


class Wallets(models.Model):
  username = models.CharField(max_length=255, primary_key=True)
  key = models.CharField(max_length=255, blank=False)
  transactionnum = models.IntegerField(blank=False)

class Nodes(models.Model):
  uri = models.CharField(max_length=255, primary_key=True)
  x = models.FloatField(blank=False)
  y = models.FloatField(blank=False)

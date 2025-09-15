import os
from django.conf import settings

import requests


class PaystackClient:
    def __init__(self):
        self.base_url = "https://api.paystack.co"
        self.secret_key = settings.PAYSTACK_SECRET_KEY  # <- use Django settings

        if not self.secret_key:
            raise ValueError("PAYSTACK_SECRET_KEY not set in environment variables")

        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def initialize_transaction(
        self, email: str, amount: int, reference: str, currency: str = "NGN"
    ):
        """
        Initialize a Paystack transaction.
        - email: customer email
        - amount: in kobo (e.g. 5000 = ₦50)
        - reference: unique transaction ref (we use order_id)
        - currency: usually NGN
        """
        payload = {
            "email": email,
            "amount": amount,
            "currency": currency,
            "reference": reference,
        }
        resp = requests.post(
            f"{self.base_url}/transaction/initialize",
            headers=self.headers,
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()

    def verify_transaction(self, reference: str):
        """
        Verify a transaction by its reference.
        """
        resp = requests.get(
            f"{self.base_url}/transaction/verify/{reference}", headers=self.headers
        )
        resp.raise_for_status()
        return resp.json()

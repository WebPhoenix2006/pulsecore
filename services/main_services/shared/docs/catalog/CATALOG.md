Catalog
📦 Entities

Categories

Products

🔑 Endpoints
List Categories – GET /api/catalog/categories/

Response

[
{
"id": 1,
"name": "Beverages",
"description": "All kinds of drinks",
"created_at": "2025-09-11T07:10:00Z"
}
]

Create Category – POST /api/catalog/categories/

Request

{
"name": "Desserts",
"description": "Sweet items like cakes, ice cream"
}

Response

{
"id": 2,
"name": "Desserts",
"description": "Sweet items like cakes, ice cream",
"created_at": "2025-09-11T07:12:00Z"
}

Retrieve Category – GET /api/catalog/categories/2/

Response

{
"id": 2,
"name": "Desserts",
"description": "Sweet items like cakes, ice cream",
"created_at": "2025-09-11T07:12:00Z"
}

Update Category – PUT /api/catalog/categories/2/

Request

{
"name": "Desserts & Sweets",
"description": "Cakes, ice creams, and other sweet items"
}

Response

{
"id": 2,
"name": "Desserts & Sweets",
"description": "Cakes, ice creams, and other sweet items",
"created_at": "2025-09-11T07:12:00Z"
}

Delete Category – DELETE /api/catalog/categories/2/

Response

{
"detail": "Category deleted successfully."
}

List Products – GET /api/catalog/products/

Response

[
{
"id": 1,
"name": "Chocolate Cake",
"description": "Rich chocolate layered cake",
"price": 15.99,
"category": 2,
"created_at": "2025-09-11T07:20:00Z"
}
]

Create Product – POST /api/catalog/products/

Request

{
"name": "Vanilla Ice Cream",
"description": "Classic vanilla flavor",
"price": 5.5,
"category": 2
}

Response

{
"id": 2,
"name": "Vanilla Ice Cream",
"description": "Classic vanilla flavor",
"price": 5.5,
"category": 2,
"created_at": "2025-09-11T07:22:00Z"
}

Retrieve Product – GET /api/catalog/products/2/

Response

{
"id": 2,
"name": "Vanilla Ice Cream",
"description": "Classic vanilla flavor",
"price": 5.5,
"category": 2,
"created_at": "2025-09-11T07:22:00Z"
}

Update Product – PUT /api/catalog/products/2/

Request

{
"name": "Vanilla Ice Cream (Large)",
"description": "500ml tub classic vanilla flavor",
"price": 8.0,
"category": 2
}

Response

{
"id": 2,
"name": "Vanilla Ice Cream (Large)",
"description": "500ml tub classic vanilla flavor",
"price": 8.0,
"category": 2,
"created_at": "2025-09-11T07:22:00Z"
}

Delete Product – DELETE /api/catalog/products/2/

Response

{
"detail": "Product deleted successfully."
}

⚙️ Validation & Testing

✅ 15/15 Pytest tests passed

✅ Postman tested with real data

🔒 Multi-tenancy requires X-Tenant-ID header

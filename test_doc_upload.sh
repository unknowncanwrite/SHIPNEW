#!/bin/bash

# Test document upload to see what's being stored
echo "Testing document upload..."

# Create a small test PDF (base64 encoded)
TEST_PDF="JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo="  # Minimal PDF header in base64

# Attempt to upload a document to shipment "123"
curl -X PATCH http://localhost:5000/api/shipments/123 \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [{
      "id": "test-doc-1",
      "name": "Test Document",
      "file": "data:application/pdf;base64,'$TEST_PDF'",
      "createdAt": 1734580000000
    }]
  }' 2>&1 | jq '.documents' 2>/dev/null | head -5

echo ""
echo "Checking if document was saved..."
curl -s http://localhost:5000/api/shipments/123 2>&1 | jq '.documents | length' 2>/dev/null

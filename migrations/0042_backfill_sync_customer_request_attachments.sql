-- Backfill: align attachment URL columns between customers and financing_requests
-- so historical rows match the same source-of-truth behavior as the app (customer
-- values win when present; otherwise copy from the latest request per customer).

-- 1) Push customer attachment URLs onto all related financing_requests (prefer customer when non-NULL).
UPDATE financing_requests
SET
  id_attachment_url = COALESCE(
    (SELECT c.id_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    id_attachment_url
  ),
  bank_statement_attachment_url = COALESCE(
    (SELECT c.bank_statement_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    bank_statement_attachment_url
  ),
  salary_attachment_url = COALESCE(
    (SELECT c.salary_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    salary_attachment_url
  ),
  additional_attachment_url = COALESCE(
    (SELECT c.additional_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    additional_attachment_url
  )
WHERE customer_id IS NOT NULL;

-- 2) Fill customer columns from the latest request when customer is still NULL (request-only uploads).
UPDATE customers
SET
  id_attachment_url = COALESCE(
    id_attachment_url,
    (SELECT fr.id_attachment_url FROM financing_requests fr
     WHERE fr.customer_id = customers.id AND fr.id_attachment_url IS NOT NULL
     ORDER BY fr.created_at DESC, fr.id DESC LIMIT 1)
  ),
  bank_statement_attachment_url = COALESCE(
    bank_statement_attachment_url,
    (SELECT fr.bank_statement_attachment_url FROM financing_requests fr
     WHERE fr.customer_id = customers.id AND fr.bank_statement_attachment_url IS NOT NULL
     ORDER BY fr.created_at DESC, fr.id DESC LIMIT 1)
  ),
  salary_attachment_url = COALESCE(
    salary_attachment_url,
    (SELECT fr.salary_attachment_url FROM financing_requests fr
     WHERE fr.customer_id = customers.id AND fr.salary_attachment_url IS NOT NULL
     ORDER BY fr.created_at DESC, fr.id DESC LIMIT 1)
  ),
  additional_attachment_url = COALESCE(
    additional_attachment_url,
    (SELECT fr.additional_attachment_url FROM financing_requests fr
     WHERE fr.customer_id = customers.id AND fr.additional_attachment_url IS NOT NULL
     ORDER BY fr.created_at DESC, fr.id DESC LIMIT 1)
  );

-- 3) Re-sync requests from customers so every request row matches the customer row after step 2.
UPDATE financing_requests
SET
  id_attachment_url = COALESCE(
    (SELECT c.id_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    id_attachment_url
  ),
  bank_statement_attachment_url = COALESCE(
    (SELECT c.bank_statement_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    bank_statement_attachment_url
  ),
  salary_attachment_url = COALESCE(
    (SELECT c.salary_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    salary_attachment_url
  ),
  additional_attachment_url = COALESCE(
    (SELECT c.additional_attachment_url FROM customers c WHERE c.id = financing_requests.customer_id),
    additional_attachment_url
  )
WHERE customer_id IS NOT NULL;

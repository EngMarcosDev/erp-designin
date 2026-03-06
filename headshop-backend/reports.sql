# Reports (SQL Server)

-- Top 20 most sold products (all time)
SELECT TOP 20
  p.id,
  p.name,
  SUM(oi.quantity) AS total_sold
FROM OrderItem oi
JOIN Product p ON p.id = oi.productId
GROUP BY p.id, p.name
ORDER BY total_sold DESC;

-- Products by category + filters (color/material)
SELECT
  p.id,
  p.name,
  p.colors,
  p.materials,
  c.name AS category
FROM Product p
LEFT JOIN Category c ON c.id = p.categoryId
WHERE (@color IS NULL OR p.colors LIKE '%' + @color + '%')
  AND (@material IS NULL OR p.materials LIKE '%' + @material + '%')
  AND (@categorySlug IS NULL OR c.slug = @categorySlug);

# Testing Guide - T-Shirt Time

## Overview

This project uses **Vitest** for both unit testing and integration testing. Vitest integrates seamlessly with our Vite-based build system and provides fast, modern testing capabilities.

**Test Types:**
- **Unit Tests**: Test individual functions and components in isolation with mocks
- **Integration Tests**: Test actual database operations against a real PostgreSQL database

## Running Tests

### Run all tests (unit + integration)
```bash
npx vitest
```

### Run tests once (CI mode)
```bash
npx vitest run
```

### Run only unit tests
```bash
npx vitest run client server/__tests__/storage.test.ts
```

### Run only integration tests
```bash
npx vitest run server/__tests__/database.integration.test.ts
```

### Run tests with UI dashboard
```bash
npx vitest --ui
```

### Run specific test files
```bash
npx vitest run client/src/__tests__/cartUtils.test.ts
npx vitest run server/__tests__/database.integration.test.ts
```

### Run tests in watch mode (development)
```bash
npx vitest watch
```

### Generate coverage report
```bash
npx vitest run --coverage
```

## Test Structure

```
├── client/src/
│   ├── __tests__/
│   │   ├── cartUtils.test.ts                    # Cart calculation unit tests
│   │   └── formValidation.test.ts               # Form schema validation unit tests
│   └── test/
│       └── setup.ts                              # Test setup and configuration
├── server/
│   └── __tests__/
│       ├── storage.test.ts                       # Storage layer unit tests (MockStorage)
│       └── database.integration.test.ts          # Database integration tests (PostgreSQL)
└── vitest.config.ts                              # Vitest configuration
```

## What's Tested

### Frontend Tests

#### Cart Utilities (`cartUtils.test.ts`)
- ✅ Subtotal calculations for single and multiple items
- ✅ NJ sales tax calculation (8.5%)
- ✅ Total calculation (subtotal + tax)
- ✅ Cart item validation
- ✅ Price formatting
- ✅ Quantity management

**Example:**
```typescript
it('should calculate NJ sales tax at 8.5%', () => {
  const subtotal = 100.0;
  const tax = subtotal * 0.085;
  expect(tax).toBeCloseTo(8.5, 2);
});
```

#### Form Validation (`formValidation.test.ts`)
- ✅ Product schema validation
- ✅ Order schema validation
- ✅ Email format validation
- ✅ Required field validation
- ✅ Order status enum validation

### Backend Tests

#### Storage Layer - Unit Tests (`storage.test.ts`)
- ✅ Product data structure validation
- ✅ Order data structure validation
- ✅ Price calculations
- ✅ Tax calculations
- ✅ Subtotal calculations for multiple items
- ⚠️ Uses MockStorage (not real database)

#### Database Integration Tests (`database.integration.test.ts`)
- ✅ **Product CRUD**: Create, read, update, delete products in PostgreSQL
- ✅ **Order Creation**: Create orders with transactional stock updates
- ✅ **Stock Management**: Verify stock quantities are reduced when orders are placed
- ✅ **Data Types**: Verify decimal prices stored as strings, arrays stored correctly
- ✅ **Database Constraints**: Test insufficient stock rejection
- ✅ **Multi-item Orders**: Orders with multiple products and combined stock updates
- ✅ **Order Status Updates**: Update order status and payment status
- ✅ **Retrieval Operations**: Get orders by number, list all orders

## Test Coverage

**Current Status: 50+ tests passing (100% pass rate)**

Test coverage includes:
- **Cart utilities** (15 tests): Cart calculations, tax calculations, add/remove/update operations, localStorage integration
- **Form validation** (10 tests): Product schema validation, order schema validation, required fields, data types
- **Storage layer - Unit** (12 tests): MockStorage interface, price calculations
- **Database Integration** (13+ tests): Real PostgreSQL operations, stock updates, transactions

**What's Actually Tested:**

**Unit Tests:**
- ✅ **Real cart utilities** from `client/src/lib/cart.ts`
- ✅ **Real Zod schemas** from `shared/schema.ts`
- ✅ **Storage interface** with MockStorage

**Integration Tests:**
- ✅ **Real DatabaseStorage** against actual PostgreSQL database
- ✅ **Transactional stock updates** via `createOrderWithStockUpdate()`
- ✅ **Database constraints** and error handling
- ✅ **Decimal type handling** (prices as strings)
- ✅ **Array type handling** (sizes and colors)
- ✅ **Order retrieval** by order number
- ✅ **Stock quantity validation** before order creation

**Important Notes:**
- **Unit tests** use MockStorage and don't require a database connection
- **Integration tests** require a real PostgreSQL database (DATABASE_URL environment variable)
- Integration tests automatically clean up test data before and after each test
- Integration tests verify actual database operations, constraints, and transactions

## Writing New Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Mocking API Calls

```typescript
import { vi } from 'vitest';

const mockApiRequest = vi.fn();

it('should call API', async () => {
  mockApiRequest.mockResolvedValue({ data: 'test' });
  const result = await fetchData();
  expect(mockApiRequest).toHaveBeenCalled();
});
```

## Best Practices

1. **Test file naming**: Use `.test.ts` or `.spec.ts` suffix
2. **Descriptive test names**: Use `it('should...')` format
3. **One assertion per test**: Keep tests focused
4. **Use beforeEach/afterEach**: For setup and cleanup
5. **Mock external dependencies**: Keep tests isolated
6. **Test edge cases**: Empty arrays, null values, boundary conditions
7. **Use toBeCloseTo()**: For floating-point comparisons

## Common Matchers

```typescript
// Equality
expect(value).toBe(expected)
expect(value).toEqual(expected)

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()

// Numbers
expect(number).toBeGreaterThan(3)
expect(number).toBeLessThan(5)
expect(number).toBeCloseTo(0.3, 2) // For decimals

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)

// Strings
expect(string).toMatch(/pattern/)

// DOM (with @testing-library/jest-dom)
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toHaveTextContent('text')
```

## Troubleshooting

### Tests not found
- Ensure test files end with `.test.ts` or `.spec.ts`
- Check that files are in the correct directories
- Verify `vitest.config.ts` includes the right patterns

### Import errors
- Check path aliases in `vitest.config.ts`
- Ensure `@shared` and `@` aliases are configured
- Use relative imports if aliases don't work

### Type errors
- Install `@types/` packages for libraries
- Check `tsconfig.json` configuration
- Ensure types are exported correctly

## CI/CD Integration

To integrate tests into your deployment pipeline:

```bash
# In your CI/CD config
npm install
npx vitest run --reporter=json --outputFile=test-results.json
```

## Integration Testing Details

### What Are Integration Tests?

Integration tests verify that different parts of the application work together correctly. Unlike unit tests that use mocks, integration tests:

- ✅ Connect to a real PostgreSQL database
- ✅ Execute actual SQL queries via Drizzle ORM
- ✅ Verify database constraints are enforced
- ✅ Test transactional operations (stock updates)
- ✅ Validate data type conversions (decimals, arrays)

### Running Integration Tests

Integration tests require the `DATABASE_URL` environment variable:

```bash
# Automatically uses development database
npx vitest run server/__tests__/database.integration.test.ts
```

### Integration Test Structure

```typescript
import { storage } from '../storage';
import { db } from '../db';

describe('Database Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  it('should create product and reduce stock on order', async () => {
    // Create test product
    const product = await storage.createProduct({...});
    
    // Create order with stock update
    const order = await storage.createOrderWithStockUpdate(
      orderData,
      [{ productId: product.id, quantity: 2 }]
    );
    
    // Verify stock was reduced
    const updated = await storage.getProduct(product.id);
    expect(updated.stockQuantity).toBe(originalStock - 2);
  });
});
```

### Key Integration Test Scenarios

1. **Product CRUD Operations**
   - Create products with all required fields
   - Retrieve products by ID
   - Update product details and stock
   - Delete products

2. **Order Creation with Stock Updates**
   - Create orders with single/multiple line items
   - Verify transactional stock updates
   - Test insufficient stock rejection
   - Validate decimal price handling

3. **Data Type Validation**
   - Decimal prices stored as strings
   - Arrays for sizes and colors
   - JSON for order line items
   - Date timestamps

4. **Error Handling**
   - Non-existent product lookup
   - Insufficient stock errors
   - Invalid order data

### Best Practices for Integration Tests

1. **Cleanup Data**: Always clean up test data in `beforeEach` and `afterEach`
2. **Use Unique IDs**: Use predictable order numbers (TEST-ORDER-001) for easy cleanup
3. **Test Transactions**: Verify operations are atomic (stock updates with orders)
4. **Verify Side Effects**: Check that database state changes as expected
5. **Test Constraints**: Verify database enforces rules (unique emails, stock limits)

### Debugging Integration Tests

```bash
# Run with verbose output
npx vitest run server/__tests__/database.integration.test.ts --reporter=verbose

# Run specific test
npx vitest run -t "should reduce stock when order is created"

# Watch mode for development
npx vitest watch server/__tests__/database.integration.test.ts
```

## Future Improvements

- [x] Add database integration tests for CRUD operations
- [x] Add integration tests for stock management
- [ ] Add component testing with React Testing Library
- [ ] Add integration tests for API routes with supertest
- [ ] Add E2E tests with Playwright (already available via run_test tool)
- [ ] Increase coverage to 90%+
- [ ] Add snapshot testing for UI components
- [ ] Add performance benchmarks

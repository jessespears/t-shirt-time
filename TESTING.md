# Testing Guide - T-Shirt Time

## Overview

This project uses **Vitest** for unit testing both frontend and backend code. Vitest integrates seamlessly with our Vite-based build system and provides fast, modern testing capabilities.

## Running Tests

### Run all tests
```bash
npx vitest
```

### Run tests once (CI mode)
```bash
npx vitest run
```

### Run tests with UI
```bash
npx vitest --ui
```

### Run specific test files
```bash
npx vitest run client/src/__tests__/cartUtils.test.ts
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
│   │   ├── cartUtils.test.ts        # Cart calculation tests
│   │   └── formValidation.test.ts   # Form schema validation tests
│   └── test/
│       └── setup.ts                  # Test setup and configuration
├── server/
│   └── __tests__/
│       └── storage.test.ts           # Storage layer tests
└── vitest.config.ts                  # Vitest configuration
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

#### Storage Layer (`storage.test.ts`)
- ✅ Product data structure validation
- ✅ Order data structure validation
- ✅ Price calculations
- ✅ Tax calculations
- ✅ Subtotal calculations for multiple items

## Test Coverage

**Current Status: 37/37 tests passing (100% pass rate)**

Test coverage includes:
- **Cart utilities** (15 tests): Cart calculations, tax calculations, add/remove/update operations, localStorage integration
- **Form validation** (10 tests): Product schema validation, order schema validation, required fields, data types
- **Storage layer** (12 tests): Product CRUD operations, order creation and management, price calculations

**What's Actually Tested:**
- ✅ **Real cart utilities** from `client/src/lib/cart.ts` - calculateCartTotals, add/remove/update operations with localStorage
- ✅ **Real Zod schemas** from `shared/schema.ts` - insertProductSchema and insertOrderSchema validation
- ⚠️ **Storage interface** - Tests use MockStorage implementation, not actual DatabaseStorage. Database CRUD logic, transactions, and constraints are NOT tested.

**Important Limitations:**
- Storage tests mock the IStorage interface and don't exercise actual database operations
- No testing of database constraints, stock updates, or transaction rollbacks
- Schema tests validate Drizzle-generated Zod schemas but don't enforce custom business rules (e.g., positive prices, valid email format)

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

## Future Improvements

- [ ] Add component testing with React Testing Library
- [ ] Add integration tests for API routes
- [ ] Add E2E tests with Playwright (already available via run_test tool)
- [ ] Increase coverage to 90%+
- [ ] Add snapshot testing for UI components
- [ ] Add performance benchmarks

# UI Components

Simple, reusable UI components built with React, TypeScript, and Tailwind CSS.

## Components

### Button

A simple button component with basic variants.

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md">
  Click me
</Button>;
```

**Props:**

- `variant`: "primary" | "secondary"
- `size`: "sm" | "md" | "lg"

### Input

A basic input component with label and error support.

```tsx
import { Input } from "@/components/ui";

<Input
  label="Email"
  placeholder="Enter your email"
  error="This field is required"
/>;
```

**Props:**

- `label`: string
- `error`: string

### NumberInput

A specialized input for numeric values that fixes the "0.0" default value issue.

```tsx
import { NumberInput } from "@/components/ui";

<NumberInput
  label="Price"
  value={price}
  onChange={(value, numberValue) => setPrice(value)}
  decimalPlaces={2}
  prefix="$"
  placeholder="0.00"
/>;
```

**Props:**

- `label`: string
- `error`: string
- `value`: number | string
- `onChange`: (value: string, numberValue: number) => void
- `decimalPlaces`: number
- `prefix`: string
- `suffix`: string

### Badge

A simple status indicator.

```tsx
import { Badge } from "@/components/ui";

<Badge variant="success">Active</Badge>;
```

**Props:**

- `variant`: "default" | "success" | "error"

## Key Features

### Number Input Fix

The `NumberInput` component solves the common issue where number inputs show "0.0" as default value. It:

- Allows empty string values
- Validates decimal places
- Supports prefix/suffix
- No forced default values

## Usage

```tsx
import { Button, Input, NumberInput, Badge } from "@/components/ui";

function MyComponent() {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <Input label="Name" placeholder="Enter name" />
      <NumberInput label="Amount" decimalPlaces={2} prefix="$" />
      <Button variant="primary">Submit</Button>
    </div>
  );
}
```

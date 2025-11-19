# SAP Integration Configuration UI

A visual editor for SAP order payload mapping configurations. This tool allows you to upload, edit, validate, and test YAML configuration files that define how order data maps to SAP payloads.

## Features

- **Visual Configuration Editor**: Edit field and condition mappings through an intuitive UI
- **Real-time Validation**: Instant feedback on SpEL expression syntax and configuration errors
- **Test Simulator**: Test your configurations with sample data and preview generated SAP payloads
- **SpEL Expression Support**: Full support for Spring Expression Language with validation
- **Import/Export**: Upload existing YAML configurations and download modified versions

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Generate reference data from the Kotlin definitions:
```bash
npm run generate-data
npm run extract-metadata
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### 1. Upload Configuration

- Navigate to the **Upload** tab
- Drag and drop your YAML configuration file or click to browse
- Latest config file from: https://github.com/Glovo/fin-erp-integration/blob/main/src/sap/infrastructure/src/main/resources/sap-order-payload-mapping.yml
- The file will be parsed and validated automatically

### 2. Edit Field Mappings

- Go to the **Field Mappings** tab
- Expand any field to view and edit its configuration
- Modify SpEL expressions for each country
- Real-time validation shows errors and warnings

### 3. Edit Condition Mappings

- Navigate to the **Condition Mappings** tab
- Expand any condition to edit its expressions
- Conditions define values for the SAP payload's items array

### 4. Test Configuration

- Go to the **Test** tab
- Select a country from the dropdown
- Click **Generate Payload** to see the results
- View both input data and generated SAP payload side-by-side
- Copy the generated payload to clipboard if needed

### 5. Download Configuration

- Click **Download YAML** in the header
- The modified configuration will be downloaded as a YAML file

## Configuration Structure

### Field Mappings

Field mappings define how order data maps to SAP payload fields. Each field has:

- `type`: Data type (string, optional_string, double, local_date_time, etc.)
- `format`: Optional format for date/time fields
- `expressionsByCountry`: Array of country-specific expressions
- `itemsMappings`: Optional nested mappings for array types

### Condition Mappings

Condition mappings define conditions in the SAP payload's items array:

- `conditionType`: The name of the condition
- `expressionsByCountry`: Array of country-specific expressions

## SpEL Expression Support

The editor supports the following SpEL features:

- Variable access: `#input.orderMetadata.orderId`
- Null-safe navigation: `#input.orderMetadata?.storeAddressId`
- Ternary operators: `condition ? value1 : value2`
- Elvis operator: `value ?: default`
- Map literals: `{'key': 'value'}[variable]`
- Arithmetic: `+`, `-`, `*`, `/`
- String concatenation: `"text " + variable`
- Invoicing item references: `#invoicingItems['ITEM_NAME']?.grossAmount?.value`

## Project Structure

```
fin-erp-config/
├── src/
│   ├── components/          # Vue components
│   ├── services/            # Business logic and utilities
│   ├── stores/              # Pinia state management
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper utilities
├── public/
│   └── data/               # Generated reference data
└── examples/               # Example configuration files
```

## Reference Data

The application uses two generated JSON files:

- `invoicing-items.json`: All available invoicing items from the Kotlin enum
- `metadata-variables.json`: All metadata variables extracted from example configs

These are generated from:
- https://github.com/Glovo/fintech-jvm-common/blob/30e390d3acacda7f1fd6b986c9b53375cb889410/invoicing-platform-core/src/main/kotlin/com/glovoapp/invoicingplatform/core/domain/InvoicingItemDefinition.kt

- https://github.com/Glovo/fin-erp-integration/blob/main/src/sap/infrastructure/src/main/resources/sap-order-payload-mapping.yml


## Contributing

When adding new features:

1. Update type definitions in `src/types/`
2. Add services in `src/services/`
3. Create components in `src/components/`
4. Update the store if needed in `src/stores/`


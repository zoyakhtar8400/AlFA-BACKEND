/**
 * Reusable Domain Schemas (DTO Models matching PostgreSQL Tables)
 */

module.exports = {
  // Login Request / Auth
  LoginRequest: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', example: 'admin' },
      password: { type: 'string', example: 'password123' },
      terminal_id: { type: 'string', example: 'TERM_01' }
    }
  },
  AuthResponse: {
    type: 'object',
    properties: {
      status: { type: 'integer', example: 200 },
      message: { type: 'string', example: 'Login successful' },
      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'admin' },
          name: { type: 'string', example: 'System Manager' },
          role: { type: 'string', example: 'ADMIN' },
          store_id: { type: 'string', example: 'STORE_1' }
        }
      }
    }
  },

  // Table Schema
  Table: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      table_id: { type: 'integer', example: 1 },
      no: { type: 'string', example: '01' },
      table_name: { type: 'string', example: 'Table 1' },
      seats: { type: 'integer', example: 4 },
      status: { type: 'string', example: 'AVAILABLE', description: 'Status: AVAILABLE, Running, KOT_CUT, Paid, Cleaning, Reserved' },
      color: { type: 'string', example: 'white', description: 'Card display color: white, orange, green, red' },
      amount: { type: 'number', example: 0.00 },
      customer: { type: 'string', example: 'Walk-in' },
      waiter: { type: 'string', example: 'Staff' },
      floor: { type: 'string', example: 'Ground' },
      section: { type: 'string', example: 'Main Area' },
      payment_status: { type: 'string', example: 'UNPAID' }
    }
  },

  // KOT Item Schema
  KotItem: {
    type: 'object',
    required: ['itemId', 'itemName', 'qty'],
    properties: {
      itemId: { type: 'string', example: 'ITEM_101' },
      itemName: { type: 'string', example: 'Paneer Butter Masala' },
      variantId: { type: 'string', example: '' },
      variantName: { type: 'string', example: 'Full' },
      qty: { type: 'integer', example: 2 },
      unitPrice: { type: 'number', example: 240.00 },
      price: { type: 'number', example: 240.00 },
      rate: { type: 'number', example: 240.00 },
      total: { type: 'number', example: 480.00 },
      remark: { type: 'string', example: 'Medium Spicy' }
    }
  },

  // Create KOT Payload
  CreateKotRequest: {
    type: 'object',
    required: ['tableId', 'items'],
    properties: {
      tableId: { type: 'integer', example: 1 },
      tableName: { type: 'string', example: 'Table 1' },
      customerName: { type: 'string', example: 'Walk-in' },
      waiter: { type: 'string', example: 'Captain Rahul' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/KotItem' }
      }
    }
  },

  // KOT Record Response
  KOT: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 42 },
      kot_id: { type: 'string', example: 'KOT-104' },
      table_id: { type: 'integer', example: 1 },
      table_name: { type: 'string', example: 'Table 1' },
      status: { type: 'string', example: 'Sent to Kitchen' },
      item_count: { type: 'integer', example: 3 },
      created_time: { type: 'string', example: '14:30:00' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/KotItem' }
      }
    }
  },

  // Move KOT Request
  MoveKotRequest: {
    type: 'object',
    required: ['toTableId'],
    properties: {
      toTableId: { type: 'integer', example: 2 },
      toTableNo: { type: 'string', example: '2' }
    }
  },

  // Order Schema
  Order: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 39 },
      bill_no: { type: 'string', example: 'BILL-0039' },
      table_id: { type: 'integer', example: 1 },
      table_name: { type: 'string', example: 'Table 1' },
      customer_name: { type: 'string', example: 'John Doe' },
      mobile: { type: 'string', example: '9876543210' },
      subtotal: { type: 'number', example: 850.00 },
      tax_amount: { type: 'number', example: 42.50 },
      discount_amount: { type: 'number', example: 0.00 },
      grand_total: { type: 'number', example: 892.50 },
      payment_status: { type: 'string', example: 'PAID' },
      payment_method: { type: 'string', example: 'CASH' },
      created_at: { type: 'string', example: '2026-08-03T14:30:00.000Z' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/KotItem' }
      }
    }
  },

  // Reservation Schema
  Reservation: {
    type: 'object',
    required: ['tableId', 'customerName'],
    properties: {
      id: { type: 'integer', example: 15 },
      reservationId: { type: 'string', example: 'RES-1002' },
      tableId: { type: 'integer', example: 3 },
      tableName: { type: 'string', example: 'Table 3' },
      tableNo: { type: 'string', example: '3' },
      customerName: { type: 'string', example: 'Rohan Sharma' },
      phone: { type: 'string', example: '9820098200' },
      persons: { type: 'integer', example: 4 },
      occasion: { type: 'string', example: 'Birthday Dinner' },
      checkIn: { type: 'string', example: '2026-08-03T20:00:00.000Z' },
      status: { type: 'string', example: 'Reserved' }
    }
  },

  // Guest / Customer Schema
  Customer: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 12 },
      name: { type: 'string', example: 'Anita Desai' },
      phone: { type: 'string', example: '9876543210' },
      email: { type: 'string', example: 'anita@example.com' },
      address: { type: 'string', example: 'Mumbai, India' },
      id_proof_type: { type: 'string', example: 'Aadhaar' },
      id_proof_number: { type: 'string', example: '1234-5678-9012' }
    }
  },

  // Billing / Payment Settlement Payload
  PaymentSettlementRequest: {
    type: 'object',
    required: ['tableId', 'paymentMethod', 'grandTotal'],
    properties: {
      tableId: { type: 'integer', example: 1 },
      paymentMethod: { type: 'string', example: 'CASH', description: 'CASH, CARD, UPI, SPLIT' },
      subtotal: { type: 'number', example: 500.00 },
      taxAmount: { type: 'number', example: 25.00 },
      discountPercent: { type: 'number', example: 0.00 },
      discountAmount: { type: 'number', example: 0.00 },
      grandTotal: { type: 'number', example: 525.00 },
      splitCash: { type: 'number', example: 200.00 },
      splitCard: { type: 'number', example: 325.00 },
      splitUPI: { type: 'number', example: 0.00 }
    }
  },

  // Category / Department Schema
  Category: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 5 },
      category_name: { type: 'string', example: 'Main Course' },
      is_active: { type: 'integer', example: 1 }
    }
  },

  // Menu Item Schema
  MenuItem: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 101 },
      item_name: { type: 'string', example: 'Paneer Butter Masala' },
      category_id: { type: 'integer', example: 5 },
      price: { type: 'number', example: 240.00 },
      rate: { type: 'number', example: 240.00 },
      active: { type: 'integer', example: 1 }
    }
  },

  // Room / Front Desk Schema
  Room: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 201 },
      room_number: { type: 'string', example: '101' },
      room_type: { type: 'string', example: 'Deluxe Suit' },
      status: { type: 'string', example: 'VACANT', description: 'VACANT, OCCUPIED, CLEANING, MAINTENANCE' },
      rate_per_night: { type: 'number', example: 3500.00 }
    }
  },

  // CheckIn Request Payload
  CheckInRequest: {
    type: 'object',
    required: ['guestName', 'phone', 'roomId'],
    properties: {
      guestName: { type: 'string', example: 'Vikram Mehta' },
      phone: { type: 'string', example: '9988776655' },
      roomId: { type: 'integer', example: 201 },
      checkInDate: { type: 'string', example: '2026-08-03T12:00:00Z' },
      advanceAmount: { type: 'number', example: 2000.00 }
    }
  },

  // Housekeeping Task
  HousekeepingTask: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 8 },
      room_number: { type: 'string', example: '102' },
      assigned_staff: { type: 'string', example: 'Ramesh' },
      status: { type: 'string', example: 'IN_PROGRESS', description: 'PENDING, IN_PROGRESS, COMPLETED' },
      notes: { type: 'string', example: 'Deep clean & replace linen' }
    }
  },

  // Inventory Item
  InventoryItem: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 50 },
      item_name: { type: 'string', example: 'Basmati Rice 25kg' },
      current_stock: { type: 'number', example: 15.0 },
      unit: { type: 'string', example: 'BAGS' },
      min_stock_level: { type: 'number', example: 5.0 }
    }
  }
};

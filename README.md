# Inventory Reservation System

This  online stores sell items safely without double-selling or overselling them. It holds items for a customer while they are paying, ensuring nobody else can buy them at the same split second.

---

## A Real-World Example

Imagine you are booking Movie Tickets online:

1. You find a perfect seat and click "Select".
2. The website locks that seat and shows a 10-minute timer.
3. While your timer is running:
   * **You** are safe to type your credit card details without rushing.
   * **Other people** see your seat as "Reserved" (grayed out) and cannot select it.
4. **If your payment succeeds:** The seat becomes yours forever.
5. **If you change your mind or your timer runs out:** The seat is released immediately, and other people can select it again.

This project does exactly that for store items (like high-demand gadgets or products) stored across different warehouses!

---

## The Big Problem We Solved (The "Double Sell")

Imagine there is only 1 last iPhone left in a warehouse.
* **Person A** and **Person B** both click the "Buy" button at the exact same millisecond.
* A naive database might say "Yes, 1 item is available" to both of them.
* Both pay, but there is only 1 phone! The store has to refund one customer, creating a bad user experience.

### How We Fixed It (Row-Level Locking)
When **Person A** clicks reserve, our database temporarily locks that row in PostgreSQL using a command called `FOR UPDATE`. 

1. **Person A** enters the store and locks the inventory row.
2. **Person B** arrives a millisecond later but is told to wait at the door because the row is locked.
3. The database updates the stock for Person A.
4. **Person B** is let inside, looks at the shelf, sees 0 iPhones left, and is safely told "Sorry, sold out!" rather than getting a duplicate charge.

---

## Key Features inside the Code

* **Bulk Reservation:** You can select multiple items across different warehouses and reserve them all at once.
* **Mechanical Gear Loader:** A beautiful full-screen animated gear screen rotates while secure database holds are made.
* **Double-Click Safety (Idempotency):** If a customer accidentally clicks the "Confirm" button twice because of slow internet, our system detects it and only charges them once.
* **Automatic Release Timer:** A background cleaner runs every minute. If a customer abandons their checkout cart, their held items are returned to the catalog automatically.

---

## Project Architecture (Template Layout)

We organized the files into a clean template layout to keep the code neat:
* `src/types/`: Centralized database model type definitions.
* `src/hooks/`: Reusable custom code (like the checkout countdown timer).
* `src/services/`: Client network requests to our API.
* `src/components/buttons/`: Peach windy leaf interactive action buttons.
* `src/components/layout/`: Standard headers, dispatch trackers, and background floating orbs.
* `src/components/loaders/`: The gearbox loader animation files.
* `src/components/pages/`: Decoupled screen layouts (so pages are clean and load quickly).
* `src/app/`: The Next.js server page routing entry points.

---

## How to Run It on Your Computer

### Prerequisites
* Node.js installed on your computer.
* A PostgreSQL database (like a free database from Neon.tech).

### Setup Steps

```bash
# 1. Clone this repository
git clone https://github.com/your-username/allo-inventory
cd allo-inventory

# 2. Install dependencies
npm install

# 3. Create your environment file
# Copy the file and name it '.env' (do not share this file on GitHub!)
cp .env.example .env

# 4. Connect your database
# Open your new '.env' file and paste your PostgreSQL URL inside:
# DATABASE_URL="postgresql://username:password@your-host:5432/db"

# 5. Push the schema to your database
npm run db:generate
npm run db:push

# 6. Seed initial test items
npm run db:seed

# 7. Start your local development server!
npm run dev
```

Now, open http://localhost:3000 in your browser!

### Live demo
https://22mis0372inventory-qluy.vercel.app/

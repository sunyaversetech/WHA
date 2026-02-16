import type { Deal } from '../types';

const deals: Deal[] = [
  {
    id: 'lakeside-pahilo-visit',
    title: 'Pahilo Visit 5% OFF Welcome Deal',
    description: '',
    coupon: 'WHA5',
    business: 'Lake Side Gurkhas',
    businessId: 'lakeside-gurkhas',
    expiryDate: 'August 29, 2025',
    image: '/deals/wha-deal.png',
    city: 'Canberra',
    category: 'food',
    details: `
      <ul>
        <li>5% off your total bill </li>
        <li>Valid for dine-in reservations only</li>
        <li>Reservation must be made at least 1 hour in advance</li>
        <li>Exclusive to What's Happening Australia users</li>
      </ul>
    `,
    redeem: `
      <ol class="list-decimal list-inside space-y-2 text-green-700 mb-6">
        <li>Book a table online or by phone at least 1 hour in advance. 
        <br><strong>IMPORTANT:</strong> Add the coupon code in the reservation notes.</li>
        <li>Show your booking confirmation with the applied code when you arrive.</li>
      </ol>
  
      <div class="flex flex-col sm:flex-row gap-3 mt-4">
        <a
          href="https://lakesidegurkhas.com.au/"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-green-100 hover:bg-green-600 text-green-800 border-green-300 border text-sm font-semibold px-4 py-2 rounded-md text-center"
        >
          Reserve Now
        </a>
  
        <a
          href="tel:+61262326997"
          class="bg-green-100 hover:bg-green-200 text-green-800 border-green-300 border text-sm font-semibold px-4 py-2 rounded-md text-center"
        >
          Call to Book
        </a>
      </div>
    `,
    terms:
      'Reservation must be made at least 1 hour in advance. Mention coupon code in the reservation notes. Dine-in only. Not valid with other offers.',
  },

  // {
  //   id: "6",
  //   title: "Exciting Deal Coming Soon!",
  //   description:
  //     "A new offer from What’s Happening Australia is on its way. Stay tuned for something special.",
  //   coupon: "HAPPY5",
  //   business: "What’s Happening Australia",
  //   businessId: "whats-happening-australia",
  //   expiryDate: "",
  //   image: "/deals/wha-deals.jpg",
  //   category: "entertainment",
  //   details: `
  //     <div class="space-y-4">
  //       <p><strong>What’s Happening Australia</strong> is preparing something exciting for the Nepali community in Canberra and Sydney!</p>

  //       <h3 class="text-lg font-semibold">What’s Coming?</h3>
  //       <p>We’re working on exclusive community deals and surprise offers to support local businesses and give back to our amazing audience.</p>

  //       <h3 class="text-lg font-semibold">Stay Tuned</h3>
  //       <p>New deals will be announced soon. Keep an eye on <a href="https://whatshappeningaustralia.com" class="text-blue-600 underline">whatshappeningaustralia.com</a> and our social pages for the latest updates.</p>
  //     </div>
  //   `,
  //   terms:
  //     "This offer is not yet active. Check back soon for full details and redemption instructions.",
  // },
  // {
  //   id: "7",
  //   title: "Exciting Deal Coming Soon!",
  //   description:
  //     "A new offer from What’s Happening Australia is on its way. Stay tuned for something special.",
  //   coupon: "NEW10",
  //   business: "What’s Happening Australia",
  //   businessId: "whats-happening-australia",
  //   expiryDate: "",
  //   image: "/deals/wha-deals.jpg",
  //   category: "entertainment",
  //   details: `
  //     <div class="space-y-4">
  //       <p><strong>What’s Happening Australia</strong> is preparing something exciting for the Nepali community in Canberra and Sydney!</p>

  //       <h3 class="text-lg font-semibold">What’s Coming?</h3>
  //       <p>We’re working on exclusive community deals and surprise offers to support local businesses and give back to our amazing audience.</p>

  //       <h3 class="text-lg font-semibold">Stay Tuned</h3>
  //       <p>New deals will be announced soon. Keep an eye on <a href="https://whatshappeningaustralia.com" class="text-blue-600 underline">whatshappeningaustralia.com</a> and our social pages for the latest updates.</p>
  //     </div>
  //   `,
  //   terms:
  //     "This offer is not yet active. Check back soon for full details and redemption instructions.",
  // },
  // {
  //   id: "8",
  //   title: "Exciting Deal Coming Soon!",
  //   description:
  //     "A new offer from What’s Happening Australia is on its way. Stay tuned for something special.",
  //   coupon: "WOW20",
  //   business: "What’s Happening Australia",
  //   businessId: "whats-happening-australia",
  //   expiryDate: "",
  //   image: "/deals/wha-deals.jpg",
  //   category: "entertainment",
  //   details: `
  //     <div class="space-y-4">
  //       <p><strong>What’s Happening Australia</strong> is preparing something exciting for the Nepali community in Canberra and Sydney!</p>

  //       <h3 class="text-lg font-semibold">What’s Coming?</h3>
  //       <p>We’re working on exclusive community deals and surprise offers to support local businesses and give back to our amazing audience.</p>

  //       <h3 class="text-lg font-semibold">Stay Tuned</h3>
  //       <p>New deals will be announced soon. Keep an eye on <a href="https://whatshappeningaustralia.com" class="text-blue-600 underline">whatshappeningaustralia.com</a> and our social pages for the latest updates.</p>
  //     </div>
  //   `,
  //   terms:
  //     "This offer is not yet active. Check back soon for full details and redemption instructions.",
  // },
  //   {
  //     id: "1",
  //     title: "Free Coffee with Any Breakfast Item",
  //     description: "Order any breakfast item and get a free small coffee of your choice.",
  //     business: "WHA Cafe",
  //     businessId: "wha-cafe",
  //     expiryDate: "August 31, 2025",
  //     image: "/deals/wha-coffee.png",
  //     category: "food",
  //     details: `
  //       <div class="space-y-4">
  //         <p>Start your morning right at WHA Cafe with a free cup of freshly brewed coffee when you order any breakfast item.</p>

  //         <h3 class="text-lg font-semibold">Breakfast Highlights:</h3>
  //         <ul class="list-disc pl-5 space-y-1">
  //           <li>Masala Omelette Wrap</li>
  //           <li>Vegetarian Breakfast Bowl</li>
  //           <li>Toast with Himalayan Honey & Yogurt</li>
  //           <li>Chickpea Avo Smash</li>
  //         </ul>

  //         <h3 class="text-lg font-semibold">Coffee Options:</h3>
  //         <p>Choose from Espresso, Latte, Flat White, Long Black, or Chai Latte.</p>

  //         <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //         <p>Show this offer at the counter before placing your order. Valid for in-store orders only.</p>
  //       </div>
  //     `,
  //     terms:
  //       "Valid until August 31, 2025. One free coffee per customer per day. Not valid with other promotions. In-store only. Available weekdays before 11:30 AM.",
  //   }
  //   ,
  //   {
  //     id: "2",
  //     title: "Thali at $30 Only",
  //     description: "Enjoy a free thali with every thali purchase. Available for dine-in guests only at WHA Restaurant.",
  //     business: "WHA Restaurant",
  //     businessId: "wha-restaurant",
  //     expiryDate: "May 15, 2025",
  //     image: "/deals/wha-rest.png",
  //     category: "food",
  //     details: `
  //       <div class="space-y-4">
  //         <p>Share a flavorful Nepali experience with someone special! Take advantage of our exclusive buy one, get one free thali offer at WHA Restaurant.</p>

  //         <h3 class="text-lg font-semibold">Deal Includes:</h3>
  //         <p>Order any of our premium thali sets and receive a second thali (of equal or lesser value) for free. Choose from:</p>
  //         <ul class="list-disc pl-5 space-y-1">
  //           <li>Classic Nepali Thali</li>
  //           <li>Vegetarian Fusion Thali</li>
  //           <li>Weekend Chef's Special Thali</li>
  //         </ul>

  //         <h3 class="text-lg font-semibold">Every Thali Comes With:</h3>
  //         <p>Steamed rice, lentil soup, sautéed greens, homemade achar, crispy papad, yogurt, and your choice of main curry (veg or non-veg).</p>

  //         <h3 class="text-lg font-semibold">Redemption Instructions:</h3>
  //         <p>Show this deal to our staff while placing your order. For best experience, book a table in advance — especially on weekends.</p>
  //       </div>
  //     `,
  //     terms:
  //       "Valid until May 15, 2025. Offer valid for dine-in only. One free thali per table. Cannot be combined with other promotions. Valid Monday to Thursday. Not applicable on public holidays.",
  //   }
  // ,
  // {
  //   id: "4",
  //   title: "Spend $50, Get $5 Off",
  //   description: "Shop for $50 or more and instantly get $5 off your total bill at WHA Grocery.",
  //   business: "WHA Grocery",
  //   businessId: "wha-grocery",
  //   expiryDate: "September 30, 2025",
  //   image: "/deals/wha-grocery.png",
  //   category: "grocery",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Enjoy savings on your weekly shop! Spend $50 or more at WHA Grocery and get $5 off your total bill — automatically applied at checkout.</p>

  //       <h3 class="text-lg font-semibold">What You Can Buy:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Fresh produce and herbs</li>
  //         <li>Frozen snacks and momos</li>
  //         <li>Rice, lentils, and grains</li>
  //         <li>Spices, tea, and masalas</li>
  //         <li>Instant noodles and curry kits</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>No coupon needed! Just mention the "Spend & Save" deal or scan the QR code at checkout. Discount applied on eligible transactions of $50 or more.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until September 30, 2025. Minimum spend of $50 required. One redemption per visit. Excludes tobacco, alcohol, and phone top-ups. Not valid with other in-store discounts.",
  // }

  // demo

  // {
  //   id: "1",
  //   title: "20% Off All Momo Varieties",
  //   description: "Enjoy 20% off on all varieties of momos, including chicken, buff, veg, and paneer options.",
  //   business: "The Kathmandu Momo House",
  //   businessId: "kathmandu-momo-house",
  //   expiryDate: "June 30, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "food",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Treat yourself to our delicious, handcrafted momos at a special price! For a limited time, enjoy 20% off all our momo varieties.</p>

  //       <h3 class="text-lg font-semibold">Deal Includes:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Chicken Momos (Steamed, Fried, or Kothey)</li>
  //         <li>Buff Momos (Steamed, Fried, or Kothey)</li>
  //         <li>Vegetable Momos (Steamed, Fried, or Kothey)</li>
  //         <li>Paneer Momos (Steamed, Fried, or Kothey)</li>
  //         <li>Jhol Momos (Soup Dumplings)</li>
  //         <li>C-Momos (Chili Sauce Momos)</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply mention this deal when ordering in-store or use code MOMO20 when ordering online. Valid for dine-in, takeaway, and delivery orders.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until June 30, 2025. Cannot be combined with other offers. Valid for dine-in, takeaway, and delivery orders.",
  // },
  // {
  //   id: "2",
  //   title: "Buy 1 Get 1 Free Thali",
  //   description: "Purchase one Nepali thali and get another one free. Valid for dine-in only.",
  //   business: "Lake Side Gurkhas",
  //   businessId: "lakeside-gurkhas",
  //   expiryDate: "May 15, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "food",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Bring a friend and enjoy our authentic Nepali thali with this special buy one, get one free offer!</p>

  //       <h3 class="text-lg font-semibold">Deal Details:</h3>
  //       <p>Purchase any of our signature thali sets and receive a second thali of equal or lesser value absolutely free. Our thali sets include:</p>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Traditional Nepali Thali</li>
  //         <li>Vegetarian Thali</li>
  //         <li>Thakali Thali</li>
  //         <li>Special Weekend Thali</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">Each Thali Includes:</h3>
  //       <p>Rice, dal, seasonal vegetables, pickle, papadum, yogurt, and your choice of meat or vegetarian curry.</p>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply mention this offer when ordering. Reservations recommended for weekend dining.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until May 15, 2025. Dine-in only. Cannot be combined with other offers. Valid Tuesday through Thursday only. Not valid on public holidays.",
  // },
  // {
  //   id: "3",
  //   title: "15% Student Discount on Groceries",
  //   description: "Students get 15% off on all Nepalese grocery items with valid student ID.",
  //   business: "Nepali Mart Canberra",
  //   businessId: "nepali-mart-canberra",
  //   expiryDate: "December 31, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "grocery",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Calling all students! We understand that student life can be expensive, so we're offering a special 15% discount on all Nepalese grocery items with a valid student ID.</p>

  //       <h3 class="text-lg font-semibold">Discount Applies To:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>All Dry Goods and Spices</li>
  //         <li>Frozen Foods</li>
  //         <li>Snacks and Sweets</li>
  //         <li>Fresh Produce</li>
  //         <li>Beverages</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply present your valid student ID at checkout to receive your discount. Applicable for in-store purchases only.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until December 31, 2025. Must present valid student ID. Not valid with other offers or discounts. Minimum purchase of $20 required.",
  // },
  // {
  //   id: "4",
  //   title: "Free Dessert with Main Course",
  //   description: "Get a free traditional Nepali dessert with any main course order above $20.",
  //   business: "The Hungry Buddha",
  //   businessId: "hungry-buddha",
  //   expiryDate: "July 10, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "food",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Treat yourself to a sweet ending with our special offer! Order any main course above $20 and receive a complimentary traditional Nepali dessert.</p>

  //       <h3 class="text-lg font-semibold">Choose from:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Kheer (Rice Pudding)</li>
  //         <li>Sel Roti (Sweet Rice Bread)</li>
  //         <li>Jeri (Sweet Pretzel)</li>
  //         <li>Lal Mohan (Sweet Dumplings)</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply mention this offer when placing your order. Valid for dine-in and takeaway orders.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until July 10, 2025. One free dessert per main course ordered. Main course must be valued at $20 or more. Valid for dine-in and takeaway only. Not valid for delivery orders.",
  // },
  // {
  //   id: "5",
  //   title: "10% Off Money Transfer to Nepal",
  //   description: "Send money to Nepal with 10% off on transfer fees for new customers.",
  //   business: "Himalayan Business Group",
  //   businessId: "himalayan-business-group",
  //   expiryDate: "August 31, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "services",
  //   details: `
  //     <div class="space-y-4">
  //       <p>New customers can enjoy 10% off transfer fees when sending money to Nepal through our secure and reliable money transfer service.</p>

  //       <h3 class="text-lg font-semibold">Benefits:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Competitive Exchange Rates</li>
  //         <li>Fast Transfers (typically within 24 hours)</li>
  //         <li>Secure Transactions</li>
  //         <li>Easy Online or In-Person Process</li>
  //         <li>Direct Bank Deposits in Nepal</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Register as a new customer either online or in-person and mention promo code NEPCUST10 when making your first transfer.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until August 31, 2025. For new customers only. Minimum transfer amount of $200 AUD. Cannot be combined with other offers.",
  // },
  // {
  //   id: "6",
  //   title: "Happy Hour: 2 for 1 Cocktails",
  //   description: "Enjoy 2 for 1 cocktails every Friday and Saturday from 5pm to 7pm.",
  //   business: "The Mustang Nepalese Restaurant & Bar",
  //   businessId: "mustang-restaurant",
  //   expiryDate: "September 30, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "entertainment",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Kick off your weekend with our special Happy Hour offer! Buy one cocktail and get another one free every Friday and Saturday from 5pm to 7pm.</p>

  //       <h3 class="text-lg font-semibold">Featured Cocktails:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Himalayan Sunrise (Vodka, Orange Juice, Grenadine)</li>
  //         <li>Kathmandu Mule (Nepali Spiced Rum, Ginger Beer, Lime)</li>
  //         <li>Everest Breeze (Gin, Cucumber, Mint, Lime)</li>
  //         <li>Sherpa's Secret (Whiskey, Honey, Lemon, Cinnamon)</li>
  //         <li>Classic Cocktails Also Available</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply visit during Happy Hour and order from our cocktail menu. No voucher needed!</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until September 30, 2025. Available Friday and Saturday from 5pm to 7pm only. Second cocktail must be of equal or lesser value. Valid for dine-in customers only.",
  // },
  // {
  //   id: "7",
  //   title: "30% Off First Beauty Treatment",
  //   description: "New clients receive 30% off their first beauty treatment or service.",
  //   business: "Kathmandu Beauty and Hair Salon",
  //   businessId: "kathmandu-beauty-salon",
  //   expiryDate: "October 15, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "salon",
  //   details: `
  //     <div class="space-y-4">
  //       <p>New clients can enjoy 30% off their first beauty treatment or service at Kathmandu Beauty and Hair Salon.</p>

  //       <h3 class="text-lg font-semibold">Applicable Services:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Haircuts and Styling</li>
  //         <li>Hair Coloring</li>
  //         <li>Facials and Skincare Treatments</li>
  //         <li>Threading and Waxing</li>
  //         <li>Manicures and Pedicures</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Mention this offer when booking your appointment. First-time clients only.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until October 15, 2025. For new clients only. Cannot be combined with other offers. Excludes bridal packages and group bookings.",
  // },
  // {
  //   id: "8",
  //   title: "Buy 10 Momos, Get 5 Free",
  //   description: "Purchase 10 momos and receive 5 additional momos of the same variety for free.",
  //   business: "THE MOMO POT",
  //   businessId: "the-momo-pot",
  //   expiryDate: "November 20, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "food-truck",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Momo lovers rejoice! Buy 10 momos of any variety and get 5 more of the same type absolutely free.</p>

  //       <h3 class="text-lg font-semibold">Available Varieties:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Chicken Momos</li>
  //         <li>Buff Momos</li>
  //         <li>Vegetable Momos</li>
  //         <li>Paneer Momos</li>
  //         <li>Mixed Momos</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">Cooking Styles:</h3>
  //       <p>Available in steamed, fried, or kothey (pan-fried) styles.</p>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply mention this offer when placing your order at our food truck.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until November 20, 2025. Free momos must be of the same variety and cooking style as purchased momos. Cannot be combined with other offers.",
  // },
  // {
  //   id: "9",
  //   title: "10% Off Grocery Orders Over $50",
  //   description: "Receive 10% off your total bill when you spend $50 or more on groceries.",
  //   business: "B&BS Nepalese",
  //   businessId: "bbs-nepalese",
  //   expiryDate: "December 15, 2025",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "grocery",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Stock up on your favorite Nepalese groceries and save! Spend $50 or more and receive 10% off your total bill.</p>

  //       <h3 class="text-lg font-semibold">Discount Applies To:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>All Grocery Items</li>
  //         <li>Spices and Condiments</li>
  //         <li>Frozen Foods</li>
  //         <li>Snacks and Sweets</li>
  //         <li>Fresh Produce</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>No coupon needed! Discount will be automatically applied at checkout when your purchase total reaches $50 or more (before tax).</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until December 15, 2025. Minimum purchase of $50 required (before tax). Cannot be combined with other offers or discounts. Excludes alcohol and tobacco products.",
  // },
  // {
  //   id: "10",
  //   title: "Free Coffee with Breakfast",
  //   description: "Enjoy a free regular coffee with any breakfast item purchased before 11am.",
  //   business: "Cafe @ Belco",
  //   businessId: "cafe-at-belco",
  //   expiryDate: "January 31, 2026",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "cafe",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Start your day right with a free coffee! Purchase any breakfast item before 11am and receive a complimentary regular coffee of your choice.</p>

  //       <h3 class="text-lg font-semibold">Coffee Options:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Flat White</li>
  //         <li>Cappuccino</li>
  //         <li>Latte</li>
  //         <li>Long Black</li>
  //         <li>Espresso</li>
  //         <li>Nepali Masala Tea (alternative option)</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply order any breakfast item before 11am and mention this offer to receive your free coffee.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until January 31, 2026. Available daily before 11am. One free regular-sized coffee per breakfast item purchased. Upgrade to large size available for $0.50 extra. Alternative milk options (soy, almond, oat) available for $0.50 extra.",
  // },
  // {
  //   id: "11",
  //   title: "15% Off Vehicle Service",
  //   description: "Receive 15% off any standard or comprehensive vehicle service package.",
  //   business: "Kathmandu Automotive",
  //   businessId: "kathmandu-automotive",
  //   expiryDate: "February 28, 2026",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "automotive",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Keep your vehicle in top condition with our special service discount! Receive 15% off any standard or comprehensive service package.</p>

  //       <h3 class="text-lg font-semibold">Service Packages Include:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Basic Service (Oil change, filter replacement, basic inspection)</li>
  //         <li>Standard Service (Basic service plus brake check, fluid top-up, and tire rotation)</li>
  //         <li>Comprehensive Service (Standard service plus detailed inspection and diagnostics)</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Mention this offer when booking your service appointment. Booking in advance is recommended.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until February 28, 2026. Discount applies to labor and standard parts only. Additional parts or repairs not included in the service package will be charged at regular rates. Cannot be combined with other offers.",
  // },
  // {
  //   id: "12",
  //   title: "Free Laphing Sample",
  //   description: "Try a free sample of our authentic Laphing when you visit our food truck.",
  //   business: "Capital Laphing Station",
  //   businessId: "capital-laphing",
  //   expiryDate: "March 15, 2026",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "food-truck",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Never tried Laphing before? Now's your chance! Visit our food truck and receive a free sample of our authentic Tibetan-Nepalese Laphing.</p>

  //       <h3 class="text-lg font-semibold">About Laphing:</h3>
  //       <p>Laphing is a traditional cold mung bean or wheat starch noodle dish, typically served with a spicy, tangy sauce. It's a refreshing street food popular in Nepal and Tibet, especially during summer months.</p>

  //       <h3 class="text-lg font-semibold">Sample Options:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Traditional Yellow Laphing</li>
  //         <li>White Laphing</li>
  //         <li>Spicy Special Laphing (if you dare!)</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply visit our food truck and ask for a free Laphing sample. No purchase necessary!</p>
  //     </div>
  //   `,
  //   terms: "Valid until March 15, 2026. One free sample per person. While supplies last. No purchase necessary.",
  // },
  // {
  //   id: "13",
  //   title: "Weekend Special: 25% Off All Curries",
  //   description: "Enjoy 25% off all curry dishes every weekend.",
  //   business: "Chomolungma Nepalese Cuisine",
  //   businessId: "chomolungma-cuisine",
  //   expiryDate: "April 30, 2026",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "food",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Make your weekends more flavorful with our special curry discount! Enjoy 25% off all curry dishes every Saturday and Sunday.</p>

  //       <h3 class="text-lg font-semibold">Featured Curries:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Himalayan Goat Curry</li>
  //         <li>Chicken Makhani</li>
  //         <li>Vegetable Curry</li>
  //         <li>Lamb Rogan Josh</li>
  //         <li>Prawn Masala</li>
  //         <li>Paneer Butter Masala</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply dine with us on Saturday or Sunday and the discount will be automatically applied to all curry dishes on your bill.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until April 30, 2026. Available Saturday and Sunday only. Dine-in and takeaway only. Cannot be combined with other offers or discounts.",
  // },

  // {
  //   id: "15",
  //   title: "Family Meal Deal: 4 Meals for $60",
  //   description: "Special family package with four meals, sides, and drinks for just $60.",
  //   business: "The Chimney Nepalese Restaurant & Bar",
  //   businessId: "chimney-restaurant",
  //   expiryDate: "June 15, 2026",
  //   image: "/placeholder.svg?height=400&width=600",
  //   category: "food",
  //   details: `
  //     <div class="space-y-4">
  //       <p>Enjoy a delicious family meal at a great price! Our Family Meal Deal includes four meals, sides, and drinks for just $60.</p>

  //       <h3 class="text-lg font-semibold">Package Includes:</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Choice of 4 Main Dishes (Curry, Momo, or Noodle options)</li>
  //         <li>2 Servings of Rice</li>
  //         <li>2 Naan Breads</li>
  //         <li>4 Soft Drinks or 2 Lassis</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">How to Redeem:</h3>
  //       <p>Simply ask for the Family Meal Deal when ordering. Available for dine-in, takeaway, or delivery.</p>
  //     </div>
  //   `,
  //   terms:
  //     "Valid until June 15, 2026. Available 7 days a week. Surcharge applies for premium dishes. Additional sides or drinks available at regular menu prices.",
  // },
];

export function getDeals(): Deal[] {
  return deals;
}

export function getDealById(id: string): Deal | undefined {
  return deals.find((deal) => deal.id === id);
}

export function getDealsByBusinessId(businessId: string): Deal[] {
  return deals.filter((deal) => deal.businessId === businessId);
}

export function getUniqueCities(): string[] {
  const cities = deals
    .map((deal) => deal.city)
    .filter((city): city is string => Boolean(city));
  return [...new Set(cities)].sort();
}

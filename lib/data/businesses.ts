import type { Business } from '../types';

const businesses: Business[] = [
  // Restaurants
  // {
  //   id: "wha-restaurant",
  //   name: "WHA Restaurant",
  //   description:
  //     "A modern Nepalese fusion restaurant offering vibrant flavors and a relaxed dining experience in the heart of Canberra.",
  //   location: "Braddon, Canberra",
  //   phone: "(02) 6123 4567",
  //   image: "/business/wha-rest.png",
  //   website: "wharestaurant.com.au",
  //   hours: "Mon-Sun 12:00 PM – 10:00 PM",
  //   category: "restaurant",
  //   details: `
  //     <div class="space-y-4">
  //       <p>WHA Restaurant is a contemporary Nepalese dining spot located in the bustling Braddon precinct. We serve a mix of traditional and modern Nepali dishes, crafted with fresh local ingredients.</p>

  //       <h3 class="text-lg font-semibold">Signature Dishes</h3>
  //       <ul class="list-disc pl-5 space-y-1">
  //         <li>Spicy Chicken Sekuwa</li>
  //         <li>Fusion-style Goat Curry</li>
  //         <li>Jhol Momos with house-made sauce</li>
  //         <li>Vegan-friendly Dal Bhat Platter</li>
  //       </ul>

  //       <h3 class="text-lg font-semibold">Atmosphere</h3>
  //       <p>WHA Restaurant features a cozy yet stylish interior with warm lighting and rustic decor. Ideal for casual dining, group gatherings, or special occasions.</p>

  //       <h3 class="text-lg font-semibold">Events & Bookings</h3>
  //       <p>We welcome private bookings for birthdays, corporate dinners, and community events. Reach out to our team to plan your next special evening at WHA Restaurant.</p>
  //     </div>
  //   `,
  //   latitude: -35.2731,
  //   longitude: 149.131,
  // },
  {
    id: 'lakeside-gurkhas',
    name: 'Lake Side Gurkhas',
    description:
      'Authentic Nepalese cuisine with a cozy ambiance near the lake. Popular for traditional Thakali dishes and momos.',
    location: 'Kingston, Canberra',
    city: 'Canberra',
    phone: '(02) 6232 6997',
    image: '/business/lake-side.jpg',
    website: 'lakesidegurkhas.com.au',
    hours: 'Sun-Thurs 11:00 AM – 9 PM, Fri-Sat 11:00 AM – 9:30 PM',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>Lake Side Gurkhas is one of Canberra's premier Nepalese restaurants, offering an authentic dining experience with stunning lakeside views.</p>
        
        <h3 class="text-lg font-semibold">Our Specialties</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Traditional Thakali Thali Set</li>
          <li>Handcrafted Momos (Steamed Dumplings)</li>
          <li>Himalayan Curries</li>
          <li>Nepali-style Grilled Meats</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Dining Experience</h3>
        <p>Our restaurant offers a warm, inviting atmosphere with traditional Nepalese decor and friendly service. Perfect for family dinners, date nights, or special celebrations.</p>
        
        <h3 class="text-lg font-semibold">Private Events</h3>
        <p>We offer private dining options for groups and can cater to special events. Contact us for more information about hosting your next gathering at Lake Side Gurkhas.</p>
      </div>
    `,
    latitude: -35.3134,
    longitude: 149.1421,
  },
  {
    id: 'nakha-chhe',
    name: 'Nakha Chhe',
    description:
      'Contemporary Nepalese restaurant serving a fusion of traditional and modern dishes.',
    location: 'Barton, Canberra',
    city: 'Canberra',
    phone: '0426 545 009',
    image: '/business/nakha-chhe.jpg',
    website: 'nakhachhe.com.au',
    hours: 'Wed-Sun 12 PM – 9 PM, Closed Mon-Tue',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>Nakha Chhe brings a contemporary twist to traditional Nepalese cuisine, offering a unique fusion dining experience in Canberra.</p>
        
        <h3 class="text-lg font-semibold">Our Menu</h3>
        <p>Our innovative menu combines authentic Nepalese flavors with modern culinary techniques, creating dishes that honor tradition while embracing contemporary tastes.</p>
        
        <h3 class="text-lg font-semibold">Chef's Recommendations</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Himalayan Spiced Lamb Cutlets</li>
          <li>Truffle Mushroom Momos</li>
          <li>Nepali Herb-crusted Salmon</li>
          <li>Artisanal Thali Experience</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Ambiance</h3>
        <p>Our restaurant features modern decor with subtle Nepalese influences, creating an elegant yet comfortable atmosphere for our guests.</p>
      </div>
    `,
    latitude: -35.3075,
    longitude: 149.1406,
  },
  {
    id: 'the-junction-nepalese',
    name: 'The Junction Nepalese Restaurant',
    description: 'Family-friendly spot known for authentic momos and dal bhat.',
    location: 'Wanniassa, Canberra',
    city: 'Canberra',
    phone: '(02) 6170 2526',
    image: '/business/junction.jpg',
    hours: 'Tue-Sun 11:30 AM – 8:30 PM, Closed Mon',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>The Junction Nepalese Restaurant is a beloved family-friendly establishment serving authentic Nepalese cuisine in a warm, welcoming environment.</p>
        
        <h3 class="text-lg font-semibold">Family Recipes</h3>
        <p>Our dishes are prepared using traditional family recipes passed down through generations, ensuring an authentic taste of Nepal.</p>
        
        <h3 class="text-lg font-semibold">Customer Favorites</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Homestyle Dal Bhat</li>
          <li>Steamed and Fried Momos</li>
          <li>Traditional Nepali Curries</li>
          <li>Sekuwa (Grilled Meat)</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Family-Friendly</h3>
        <p>We welcome diners of all ages and offer a special menu for children. Our relaxed atmosphere makes us the perfect spot for family gatherings.</p>
      </div>
    `,
    latitude: -35.3946,
    longitude: 149.1013,
  },
  {
    id: 'kathmandu-momo-house',
    name: 'The Kathmandu Momo House',
    description:
      'Casual eatery specializing in a variety of momos and Nepalese street food.',
    location: 'Melbourne Building, Canberra',
    city: 'Canberra',
    phone: '(02) 6181 9625',
    image: '/business/kathmandu-momo.png',
    hours: 'Daily 11 AM – 9 PM',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>The Kathmandu Momo House is Canberra's premier destination for authentic Nepalese momos and street food favorites.</p>
        
        <h3 class="text-lg font-semibold">Momo Varieties</h3>
        <p>We offer over 10 different types of momos, including traditional fillings and creative fusion options:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Classic Chicken, Buff, and Vegetable</li>
          <li>Cheese and Spinach</li>
          <li>Prawn and Garlic</li>
          <li>Chocolate Dessert Momos</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Street Food Specialties</h3>
        <p>Beyond momos, we serve authentic Nepalese street food favorites like Chatamari, Sekuwa, and Aloo Chop.</p>
        
        <h3 class="text-lg font-semibold">Quick Service</h3>
        <p>Perfect for a quick lunch or casual dinner, we offer dine-in, takeaway, and delivery options.</p>
      </div>
    `,
    latitude: -35.2787,
    longitude: 149.13,
  },
  {
    id: 'mul-chowk-kitchen',
    name: 'Mul Chowk Kitchen',
    description:
      'Modern Nepalese kitchen blending traditional flavors with a stylish dining experience.',
    location: 'Mawson, Canberra',
    city: 'Canberra',
    phone: '(02) 9718 8773',
    image: '/business/mulchowk.jpg',
    website: 'mulchowkkitchen.com.au',
    hours: 'Wed-Sun 12 PM – 9 PM, Closed Mon-Tue',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>Mul Chowk Kitchen offers a refined Nepalese dining experience, combining traditional flavors with contemporary presentation in an elegant setting.</p>
        
        <h3 class="text-lg font-semibold">Culinary Philosophy</h3>
        <p>Our chefs blend time-honored Nepalese cooking techniques with modern culinary innovations, creating dishes that are both authentic and exciting.</p>
        
        <h3 class="text-lg font-semibold">Signature Dishes</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Himalayan Herb-Crusted Rack of Lamb</li>
          <li>Nepali Spiced Seafood Platter</li>
          <li>Artisanal Momo Selection</li>
          <li>Royal Thali Experience</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Dining Atmosphere</h3>
        <p>Our restaurant features stylish decor inspired by traditional Nepalese architecture, creating an upscale yet comfortable environment for memorable dining experiences.</p>
      </div>
    `,
    latitude: -35.32,
    longitude: 149.1,
  },
  {
    id: 'chomolungma-cuisine',
    name: 'Chomolungma Nepalese Cuisine',
    description:
      'Authentic Nepalese cuisine with an emphasis on fresh ingredients and home-style cooking.',
    location: 'Griffith, Canberra',
    city: 'Canberra',
    phone: '(02) 6188 6800',
    image: '/business/chomolungma.jpg',
    website: 'chomolungmacuisine.com.au',
    hours: 'Tue-Sun 11:30 AM – 8:30 PM, Closed Mon',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>Chomolungma Nepalese Cuisine brings the authentic flavors of Nepal to Canberra, with a focus on traditional recipes and fresh, quality ingredients.</p>
        
        <h3 class="text-lg font-semibold">Our Philosophy</h3>
        <p>Named after the Tibetan name for Mount Everest, our restaurant aims to elevate Nepalese cuisine to new heights while maintaining authentic flavors and traditions.</p>
        
        <h3 class="text-lg font-semibold">Menu Highlights</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Traditional Dal Bhat Tarkari</li>
          <li>Himalayan Goat Curry</li>
          <li>Handcrafted Momos with House Special Sauce</li>
          <li>Nepali-style Grilled Fish</li>
          <li>Authentic Thukpa (Himalayan Noodle Soup)</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Home-Style Cooking</h3>
        <p>Our chefs prepare each dish with the same care and attention as they would for their own families, ensuring an authentic taste of Nepal in every bite.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'mustang-restaurant',
    name: 'The Mustang Nepalese Restaurant & Bar',
    description:
      'A blend of Nepalese cuisine and a bar atmosphere, offering a diverse menu and drinks.',
    location: 'Farrer, Canberra',
    city: 'Canberra',
    phone: '(02) 6286 8088',
    image: '/business/mustang-nepalese.png',
    website: 'themustangcanberra.com.au',
    hours: 'Thu-Sun 5 PM – 10 PM, Closed Mon-Wed',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>The Mustang Nepalese Restaurant & Bar offers a unique dining experience that combines authentic Nepalese cuisine with a modern bar atmosphere.</p>
        
        <h3 class="text-lg font-semibold">Cuisine & Drinks</h3>
        <p>Our menu features traditional Nepalese dishes alongside a carefully curated selection of wines, beers, and cocktails designed to complement the flavors of our food.</p>
        
        <h3 class="text-lg font-semibold">Signature Offerings</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Mustang Special Platter</li>
          <li>Himalayan Spiced Cocktails</li>
          <li>Nepali-style Grilled Meats</li>
          <li>Chef's Special Curry Selection</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Atmosphere</h3>
        <p>Our restaurant features a warm, inviting ambiance with Nepalese-inspired decor and a comfortable bar area, perfect for both casual dining and special occasions.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'chimney-restaurant',
    name: 'The Chimney Nepalese Restaurant & Bar',
    description:
      'Cozy Nepalese restaurant with bar service, known for flavorful curries and momos.',
    location: 'Gungahlin, Canberra',
    city: 'Canberra',
    phone: '(02) 6193 3620',
    image: '/business/chimney.jpg',
    hours: 'Wed-Sun 12 PM – 9 PM, Closed Mon-Tue',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>The Chimney Nepalese Restaurant & Bar offers a cozy dining experience with authentic Nepalese flavors in a warm, inviting atmosphere.</p>
        
        <h3 class="text-lg font-semibold">Our Specialties</h3>
        <p>We are known for our flavorful curries and handcrafted momos, prepared using traditional techniques and authentic spices imported from Nepal.</p>
        
        <h3 class="text-lg font-semibold">Menu Highlights</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Chimney Special Curry</li>
          <li>Assorted Momo Platter</li>
          <li>Himalayan Lamb Sekuwa</li>
          <li>Nepali-style Grilled Fish</li>
          <li>Traditional Thali Sets</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Bar Selection</h3>
        <p>Our bar offers a selection of local and imported beers, wines, and spirits, including some specialty drinks inspired by Nepalese flavors.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'hungry-buddha',
    name: 'The Hungry Buddha',
    description:
      'Casual dining with a Nepalese twist, offering vegetarian-friendly options.',
    location: 'Belconnen, Canberra',
    city: 'Canberra',
    phone: '(02) 5136 9017',
    image: '/business/hungry-buddha.jpg',
    website: 'thehungrybuddha.com.au',
    hours: 'Daily 11 AM – 9 PM',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>The Hungry Buddha offers a casual dining experience with authentic Nepalese cuisine and a strong focus on vegetarian and plant-based options.</p>
        
        <h3 class="text-lg font-semibold">Our Philosophy</h3>
        <p>We believe in serving food that nourishes both body and soul, with dishes that showcase the rich vegetarian tradition of Nepalese cuisine alongside meat options.</p>
        
        <h3 class="text-lg font-semibold">Menu Highlights</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Vegetable Momo Selection</li>
          <li>Buddha's Special Thali</li>
          <li>Nepali-style Paneer Dishes</li>
          <li>Traditional Lentil Curries</li>
          <li>Seasonal Vegetable Specialties</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Dietary Options</h3>
        <p>We cater to various dietary needs with clearly marked vegan, gluten-free, and dairy-free options throughout our menu.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'canberra-momo-house',
    name: 'Canberra Momo House',
    description:
      'Quick-serve Nepalese momos and snacks, perfect for takeaway or casual dining.',
    location: 'Gungahlin, Canberra',
    city: 'Canberra',
    phone: '(02) 6241 3853',
    image: '/business/canberra-momo.jpg',
    hours: 'Tue-Sun 11:30 AM – 8 PM, Closed Mon',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>Canberra Momo House specializes in authentic Nepalese momos and quick-serve snacks, offering a casual dining experience with a focus on quality and flavor.</p>
        
        <h3 class="text-lg font-semibold">Our Momos</h3>
        <p>We take pride in our handcrafted momos, available in various styles and fillings:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Steamed, Fried, or Kothey (Pan-fried)</li>
          <li>Chicken, Buff, Pork, or Vegetable Fillings</li>
          <li>Jhol Momo (Soup Dumplings)</li>
          <li>C-Momo (Chili Sauce Momos)</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Beyond Momos</h3>
        <p>Our menu also features other Nepalese favorites like Chow Mein, Thukpa, and various snacks and sides.</p>
        
        <h3 class="text-lg font-semibold">Quick Service</h3>
        <p>Perfect for a quick meal or takeaway, we focus on efficient service without compromising on quality or flavor.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'himalayan-tiger-bistro',
    name: 'The Himalayan Tiger Bistro',
    description:
      'Bistro-style Nepalese dining focusing on Himalayan regional flavors.',
    location: 'Karabar, Canberra',
    city: 'Canberra',
    phone: '0451 030 450',
    image: '/business/himalyan-tiger.jpg',
    website: 'tigersclub.com.au',
    hours: 'Fri-Sun 5 PM – 10 PM, Closed Mon-Thu',
    category: 'restaurant',
    details: `
      <div class="space-y-4">
        <p>The Himalayan Tiger Bistro offers a unique dining experience that showcases the diverse regional flavors of the Himalayan region in a casual bistro setting.</p>
        
        <h3 class="text-lg font-semibold">Regional Specialties</h3>
        <p>Our menu features dishes from various Himalayan regions, including Nepal, Tibet, Bhutan, and Northern India, each prepared with authentic techniques and ingredients.</p>
        
        <h3 class="text-lg font-semibold">Signature Dishes</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Tiger's Special Thali</li>
          <li>Himalayan Lamb Curry</li>
          <li>Tibetan Momos</li>
          <li>Bhutanese Ema Datshi</li>
          <li>Nepali Sekuwa Platter</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Weekend Dining</h3>
        <p>We operate exclusively on weekends, allowing us to focus on creating exceptional dining experiences with fresh ingredients and careful preparation.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  // Cafés

  {
    id: 'wha-cafe',
    name: 'WHA Cafe',
    description:
      'Cozy and modern cafe serving specialty coffee, breakfast, and light lunches with a Nepali twist in central Canberra.',
    location: 'City Centre, Canberra',
    city: 'Canberra',
    phone: '(02) 6170 1122',
    image: '/business/wha-coffee.png',
    website: 'whacafe.com.au',
    hours: 'Mon-Fri 7:00 AM – 3:00 PM, Sat-Sun 8:00 AM – 2:00 PM',
    category: 'cafe',
    details: `
      <div class="space-y-4">
        <p>WHA Cafe is a warm and welcoming spot located in Canberra's city centre. We offer specialty coffee, teas, and a menu inspired by both Western and Nepali flavors.</p>
  
        <h3 class="text-lg font-semibold">Popular Items</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Ginger Chai Latte</li>
          <li>Masala Omelette Wrap</li>
          <li>Breakfast Thali Bowl</li>
          <li>Himalayan Honey Toast</li>
        </ul>
  
        <h3 class="text-lg font-semibold">Ambience</h3>
        <p>Minimalist decor, Nepali artwork, soft music, and plenty of natural light make WHA Cafe the perfect place to relax, study, or catch up with friends.</p>
  
        <h3 class="text-lg font-semibold">Community Vibe</h3>
        <p>We host weekly open mic nights and support local Nepali-Australian artists by displaying their work in-store.</p>
      </div>
    `,
    latitude: -35.281,
    longitude: 149.1295,
  },
  {
    id: 'cafe-at-belco',
    name: 'Cafe @ Belco',
    description:
      'Community-focused café serving coffee, teas, and light bites with occasional cultural events.',
    location: 'Belconnen, Canberra',
    city: 'Canberra',
    phone: '(02) 6253 0478',
    image: '/business/cafe-belco.jpg',
    hours: 'Mon-Fri 7 AM – 3 PM, Sat-Sun 8 AM – 2 PM',
    category: 'cafe',
    details: `
      <div class="space-y-4">
        <p>Cafe @ Belco is more than just a café—it's a community hub where locals gather to enjoy great coffee, delicious food, and cultural connections.</p>
        
        <h3 class="text-lg font-semibold">Our Coffee</h3>
        <p>We serve specialty coffee sourced from ethical suppliers, including unique Himalayan coffee beans. Our baristas are trained to prepare your coffee just the way you like it.</p>
        
        <h3 class="text-lg font-semibold">Menu Highlights</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Nepali-style Breakfast Platters</li>
          <li>Freshly Baked Pastries</li>
          <li>Himalayan Tea Selection</li>
          <li>Light Lunch Options</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Community Events</h3>
        <p>We regularly host cultural events, language exchange meetups, and local artist showcases. Check our social media for upcoming events.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'mocha-mystic-cafe',
    name: 'Mocha Mystic Café',
    description: 'Cozy café with a Nepali twist on coffee and desserts.',
    location: 'Greenway, Canberra',
    city: 'Canberra',
    phone: '0414 002 886',
    image: '/business/mocha-mystic.jpg',
    hours: 'Tue-Sun 8 AM – 4 PM, Closed Mon',
    category: 'cafe',
    details: `
      <div class="space-y-4">
        <p>Mocha Mystic Café offers a unique coffee experience with Nepali-inspired flavors and a cozy, mystical atmosphere.</p>
        
        <h3 class="text-lg font-semibold">Specialty Drinks</h3>
        <p>Our menu features traditional coffee favorites alongside Nepali-inspired creations:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Himalayan Spiced Latte</li>
          <li>Masala Chai</li>
          <li>Nepali Butter Tea</li>
          <li>Seasonal Fruit Lassis</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Sweet Treats</h3>
        <p>Enjoy our selection of desserts that blend Australian and Nepali flavors, from traditional sel roti to fusion pastries.</p>
        
        <h3 class="text-lg font-semibold">Relaxing Atmosphere</h3>
        <p>Our café features comfortable seating, Nepali-inspired decor, and a peaceful ambiance perfect for working, reading, or catching up with friends.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  // Food Trucks
  {
    id: 'the-monkey-temple',
    name: 'The Monkey Temple',
    description:
      'Casual Nepalese eatery serving handmade momos, chow mein, choila and sekuwa as food‑truck/takeaway in Belconnen.',
    location: 'Macdermott Place, Belconnen, Canberra',
    city: 'Canberra',
    phone: '0415 053 537',
    image: '/business/monkey-temple.jpg',
    website: 'themonkeytemple.com',
    hours: 'Tue–Sun 1 PM–6:30 PM; Closed Mon',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>The Monkey Temple is a Belconnen-based food truck serving up authentic Nepalese street food in takeaway style—highly rated for its momos, choila, chow mein and more.</p>
        
        <h3 class="text-lg font-semibold">Top Menu Items</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Chicken, Buffalo & Vegetable Momos – steamed, fried, kothey or jhol</li>
          <li>C‑Momo (spicy tossed momo)</li>
          <li>Chicken, Vegetable & Buffalo Chow Mein</li>
          <li>Pork Sekuwa & Bhuttan Chiura (goat tripe with rice flakes)</li>
          <li>Spicy sausage & Pani Puri</li>
        </ul>
  
        <h3 class="text-lg font-semibold">Customer Favorites</h3>
        <p>Most‑liked dishes on Uber Eats: Chicken Chow Mein, Chicken C‑Momo, Chicken Jhol Momo.</p>
        <p>Rated ~4.7★ on Chamber of Commerce (12 reviews), praised for “authentic Nepali taste” — especially jhol momo, chow mein, sekuwa and choila.</p>
        
        <h3 class="text-lg font-semibold">Service & Ordering</h3>
        <p>Open Tue–Sun 13:00–18:30. Walk‑up takeaway at Macdermott Place. Delivery via Uber Eats and Menulog.</p>
  
        <p>Thank you for your amazing feedback for the taste of ‘Buff Choila’…still available on the menu so please come and grab it before it’s sold out!!</p>
      </div>
    `,
    latitude: -35.226928426608644,
    longitude: 149.06344881163295,
  },
  {
    id: 'friends-and-momos-woden',
    name: 'Friends & Momos Woden',
    description: 'Food truck specializing in momos and traditional snacks.',
    location: 'Phillip, Canberra',
    city: 'Canberra',
    phone: '0403 344 482',
    image: '/business/friends-and-momo.jpg',
    website: 'friendsandmomoswoden.com.au',
    hours: 'Check social media for location & hours',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>Friends & Momos Woden brings the authentic taste of Nepalese street food to Canberra through our popular food truck.</p>
        
        <h3 class="text-lg font-semibold">Momo Specialties</h3>
        <p>Our handmade momos come in various flavors and cooking styles:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Classic Chicken, Buff, and Vegetable</li>
          <li>Steamed, Fried, or Kothey (Pan-fried)</li>
          <li>Jhol Momo (Soup Dumplings)</li>
          <li>Spicy C-Momo</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Beyond Momos</h3>
        <p>We also serve other Nepalese street food favorites like Chatamari, Sekuwa, and Aloo Chop.</p>
        
        <h3 class="text-lg font-semibold">Find Us</h3>
        <p>Our food truck moves around Canberra. Follow us on social media to find our current location and operating hours.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'taste-of-himalayas',
    name: 'The Taste of Himalayas',
    description:
      'Food truck serving Himalayan delicacies and Nepalese street food.',
    location: 'Gungahlin, Canberra',
    city: 'Canberra',
    phone: '0466 049 610',
    image: '/business/taste-of-himalyan.jpg',
    hours: 'Check social media for schedule',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>The Taste of Himalayas food truck brings authentic Himalayan flavors to the streets of Canberra, offering a variety of traditional Nepalese street food and delicacies.</p>
        
        <h3 class="text-lg font-semibold">Our Menu</h3>
        <p>We specialize in a range of Himalayan dishes, prepared with authentic spices and traditional techniques:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Momos (Steamed, Fried, and Jhol)</li>
          <li>Thukpa (Himalayan Noodle Soup)</li>
          <li>Sekuwa (Grilled Meat Skewers)</li>
          <li>Chatamari (Nepalese Rice Crepes)</li>
          <li>Aloo Chop (Spiced Potato Patties)</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Locations</h3>
        <p>We operate at various locations around Canberra, including markets, festivals, and regular spots in Gungahlin. Check our social media for our current schedule and locations.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'the-momo-pot',
    name: 'THE MOMO POT',
    description:
      'Specialty momo food truck with a variety of fillings and dipping sauces.',
    location: 'Belconnen, Canberra',
    city: 'Canberra',
    phone: '0406 508 890',
    image: '/business/momo-pot.jpg',
    website: 'themomopot.com.au',
    hours: 'Fri-Sun 11 AM – 7 PM',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>THE MOMO POT is dedicated to bringing the authentic taste of Nepalese momos to Canberra, with our recipes inspired by family traditions.</p>
        
        <h3 class="text-lg font-semibold">Our Momos</h3>
        <p>We take pride in our handcrafted momos, made fresh daily with quality ingredients:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Traditional Fillings: Chicken, Buff, Pork, Vegetable</li>
          <li>Specialty Fillings: Cheese, Prawn, Lamb</li>
          <li>Cooking Styles: Steamed, Fried, Kothey, Jhol</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Signature Sauces</h3>
        <p>Our homemade dipping sauces range from mild to fiery hot, each crafted to complement our momos perfectly.</p>
        
        <h3 class="text-lg font-semibold">Catering</h3>
        <p>We offer catering services for events and parties. Contact us for custom momo platters for your next gathering.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'nepalese-mate',
    name: 'The Nepalese Mate',
    description:
      'Popular Nepalese food truck offering traditional street food like momos and chatamari.',
    location: 'Phillip, Canberra',
    city: 'Canberra',
    phone: '0402 438 857',
    image: '/business/nepalese-mate.jpg',
    website: 'thenepalesemate.com.au',
    hours: 'Check social media for current schedule',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>The Nepalese Mate is a beloved food truck bringing authentic Nepalese street food to the Canberra community with a friendly, mate-like approach.</p>
        
        <h3 class="text-lg font-semibold">Street Food Favorites</h3>
        <p>We specialize in traditional Nepalese street food items prepared with authentic recipes:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Handcrafted Momos in Various Styles</li>
          <li>Chatamari (Nepalese Rice Crepes)</li>
          <li>Bara (Lentil Patties)</li>
          <li>Sekuwa (Grilled Meat Skewers)</li>
          <li>Sel Roti (Sweet Rice Bread)</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Community Focus</h3>
        <p>We're proud to be part of the Canberra community, participating in local events and markets throughout the year.</p>
        
        <h3 class="text-lg font-semibold">Find Us</h3>
        <p>Our schedule varies weekly. Follow us on social media to find out where we'll be serving our delicious Nepalese treats next.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'moowingsteak',
    name: 'Moowingsteak',
    description: 'Gourmet steak and Nepalese fusion food truck.',
    location: 'Braddon, Canberra',
    city: 'Canberra',
    phone: '0415 582 861',
    image: '/business/mowing-steak.png',
    website: 'moowingsteak.com.au',
    hours: 'Check website/socials',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>Moowingsteak offers a unique fusion of gourmet steak dishes and Nepalese flavors, bringing an innovative culinary experience to Canberra's food truck scene.</p>
        
        <h3 class="text-lg font-semibold">Fusion Concept</h3>
        <p>Our menu combines the best of Australian beef with Nepalese spices and cooking techniques, creating a distinctive flavor profile you won't find anywhere else.</p>
        
        <h3 class="text-lg font-semibold">Signature Dishes</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Himalayan Spiced Steak Sandwich</li>
          <li>Nepali Masala Steak Fries</li>
          <li>Momo-Stuffed Steak Rolls</li>
          <li>Timur Pepper Steak Skewers</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Quality Ingredients</h3>
        <p>We use premium Australian beef and authentic Nepalese spices to ensure the highest quality in every dish we serve.</p>
        
        <h3 class="text-lg font-semibold">Locations</h3>
        <p>Find us at various locations around Braddon and at food festivals throughout Canberra. Check our website or social media for our current schedule.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'party-time-nepal',
    name: 'Party Time Nepal',
    description:
      'Food truck offering party platters and traditional Nepalese street food.',
    location: 'Queanbeyan, Canberra',
    city: 'Canberra',
    phone: '0452 023 335',
    image: '/business/party-time.jpg',
    website: 'partytimenepal.com.au',
    hours: 'By booking only / events',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>Party Time Nepal specializes in catering Nepalese cuisine for events and parties, bringing authentic flavors and festive spirit to your gatherings.</p>
        
        <h3 class="text-lg font-semibold">Event Catering</h3>
        <p>We offer customized catering packages for various events, from small private parties to large corporate functions and community celebrations.</p>
        
        <h3 class="text-lg font-semibold">Party Platters</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Momo Platters (Assorted Varieties)</li>
          <li>Nepali Appetizer Selection</li>
          <li>Street Food Stations</li>
          <li>Traditional Thali Sets</li>
          <li>Dessert Platters</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Booking Information</h3>
        <p>We operate primarily for pre-booked events rather than regular street service. Contact us to discuss your event needs and secure your booking.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'losaa-on-wheels',
    name: 'Losaa On Wheels',
    description:
      'Mobile vendor focusing on quick Nepalese snacks and beverages.',
    location: 'Belconnen, Canberra',
    city: 'Canberra',
    phone: '0452 451 834',
    image: '/business/losaa.jpg',
    website: 'partytimenepal.com.au',
    hours: 'Varies, check social media',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>Losaa On Wheels brings quick, convenient Nepalese snacks and beverages to various locations around Canberra, perfect for on-the-go eating.</p>
        
        <h3 class="text-lg font-semibold">Quick Bites</h3>
        <p>We specialize in handheld Nepalese snacks that are perfect for a quick meal or snack:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Samosas and Pakoras</li>
          <li>Aloo Chop (Spiced Potato Patties)</li>
          <li>Sel Roti (Sweet Rice Bread)</li>
          <li>Quick-serve Momos</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Beverages</h3>
        <p>Complement your snacks with our selection of traditional Nepalese drinks, including masala chai, lassi, and seasonal specialties.</p>
        
        <h3 class="text-lg font-semibold">Locations</h3>
        <p>We operate at various locations around Belconnen, including near universities, business districts, and community events. Check our social media for current locations and hours.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'capital-laphing',
    name: 'Capital Laphing Station',
    description:
      'Specializes in Laphing, a traditional spicy Tibetan-Nepalese street food.',
    location: 'Weston, Canberra',
    city: 'Canberra',
    phone: '0403 860 783',
    image: '/business/capital-laphing.jpg',
    website: 'capitallaphing.com',
    hours: 'Check website for details',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>Capital Laphing Station is dedicated to introducing Canberra to the unique flavors of Laphing, a traditional spicy Tibetan-Nepalese street food that's both refreshing and satisfying.</p>
        
        <h3 class="text-lg font-semibold">What is Laphing?</h3>
        <p>Laphing is a cold mung bean or wheat starch noodle dish, typically served with a spicy, tangy sauce and various toppings. It's especially popular during summer months for its refreshing qualities.</p>
        
        <h3 class="text-lg font-semibold">Our Varieties</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Traditional Yellow Laphing</li>
          <li>White Laphing</li>
          <li>Mixed Laphing</li>
          <li>Spicy Special Laphing</li>
          <li>Vegetarian and Vegan Options</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Seasonal Operation</h3>
        <p>We operate primarily during the warmer months when Laphing is most enjoyed. Check our website or social media for our current schedule and locations.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'early-bird-xpresso',
    name: 'Early Bird Xpresso',
    description:
      'Coffee and breakfast food truck, popular for morning commuters.',
    location: 'Belconnen, Canberra',
    city: 'Canberra',
    phone: '0411 781 835',
    image: '/business/early-bird.jpg',
    hours: 'Mon-Fri 6:30 AM – 2 PM',
    category: 'food-truck',
    details: `
      <div class="space-y-4">
        <p>Early Bird Xpresso is Canberra's favorite morning stop for quality coffee and quick breakfast options with a Nepalese twist, perfect for commuters and early risers.</p>
        
        <h3 class="text-lg font-semibold">Coffee Selection</h3>
        <p>We serve premium coffee prepared by skilled baristas, including traditional espresso drinks and Nepalese-inspired specialties like Himalayan spiced coffee.</p>
        
        <h3 class="text-lg font-semibold">Breakfast Menu</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Breakfast Momos (Morning-style Dumplings)</li>
          <li>Nepali Breakfast Wraps</li>
          <li>Quick Serve Sel Roti (Sweet Rice Bread)</li>
          <li>Freshly Baked Pastries</li>
          <li>Healthy Breakfast Bowls</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Commuter Friendly</h3>
        <p>We're strategically located for morning commuters in Belconnen, offering quick service and convenient packaging for on-the-go consumption.</p>
      </div>
    `,
    latitude: -35.22842135180529,
    longitude: 149.07514258039603,
  },
  // Grocery Stores

  {
    id: 'wha-grocery',
    name: 'WHA Grocery',
    description:
      'Your local South Asian grocery store in Canberra offering a wide selection of Nepalese, Indian, and Sri Lankan products.',
    location: 'Dickson, Canberra',
    city: 'Canberra',
    phone: '(02) 6240 7788',
    image: '/business/wha-grocery.png',
    website: 'whagrocery.com.au',
    hours: 'Mon-Sun 9:00 AM – 8:00 PM',
    category: 'grocery',
    details: `
      <div class="space-y-4">
        <p>WHA Grocery is your one-stop shop for South Asian essentials, located conveniently in Dickson. From authentic spices to fresh produce and frozen Nepali meals — we’ve got it all.</p>
  
        <h3 class="text-lg font-semibold">Popular Items</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Imported Nepali Pickles & Spices</li>
          <li>Frozen Momos & Sel Roti</li>
          <li>Fresh Indian Vegetables</li>
          <li>Lentils, Rice, and Flours</li>
          <li>Ready-to-Eat Curries & Snacks</li>
        </ul>
  
        <h3 class="text-lg font-semibold">Why Shop With Us?</h3>
        <p>We pride ourselves on competitive pricing, weekly specials, and friendly service tailored for the local South Asian community. Plenty of free parking available!</p>
  
        <h3 class="text-lg font-semibold">Community Focus</h3>
        <p>We support Nepali-owned brands and host monthly cultural product fairs. Follow us for updates on in-store tastings and seasonal promotions.</p>
      </div>
    `,
    latitude: -35.2502,
    longitude: 149.1365,
  },
  {
    id: 'wow-fresh-canberra',
    name: 'WOW Fresh',
    description:
      'Weekly fruit and veggie box delivery service offering fresh, seasonal produce across Canberra.',
    location: 'Canberra, ACT',
    city: 'Canberra',
    phone: '', // They don't publicly list a phone number on the website
    image: '/business/wow-banner-mb.png',
    hours: 'Online only – Weekly delivery',
    category: 'grocery',
    details: `
      <div class="space-y-4">
        <p>WOW Fresh is a locally run subscription service that delivers fresh, seasonal fruits and vegetables to your door each week. Focused on quality and local sourcing, WOW Fresh brings you a hassle-free way to eat healthy in Canberra.</p>
  
        <h3 class="text-lg font-semibold">Subscription Options</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Small Box (~10 items) – $39.99/week</li>
          <li>Medium Box (~15 items) – $59.99/week</li>
          <li>Large Box (~20 items) – $79.99/week</li>
        </ul>
  
        <h3 class="text-lg font-semibold">How It Works</h3>
        <p>Choose your box size based on your household needs. Every week, WOW Fresh hand-selects a variety of in-season produce and delivers it to your doorstep. You can pause, skip, or cancel your plan at any time via your online account.</p>
  
        <h3 class="text-lg font-semibold">Why Choose WOW Fresh?</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Locally sourced and seasonal produce</li>
          <li>Flexible subscription plans</li>
          <li>Convenient home delivery across Canberra</li>
          <li>No contracts – cancel or modify anytime</li>
        </ul>
  
        <p>Support local farmers while enjoying delicious and healthy food—delivered fresh to your home each week!</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'bbs-nepalese',
    name: 'B&BS Nepalese',
    description:
      'Grocery store specializing in Nepalese spices, snacks, and fresh produce.',
    location: 'Mawson, Canberra',
    city: 'Canberra',
    phone: '(02) 6231 8384',
    image: '/business/bbs-nepalese.jpg',
    hours: 'Mon-Sat 9 AM – 7 PM, Sun 10 AM – 5 PM',
    category: 'grocery',
    details: `
      <div class="space-y-4">
        <p>B&BS Nepalese is your one-stop shop for authentic Nepalese groceries, spices, and specialty items in Canberra.</p>
        
        <h3 class="text-lg font-semibold">Product Range</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Authentic Nepalese Spices and Masalas</li>
          <li>Imported Snacks and Sweets</li>
          <li>Fresh Produce and Vegetables</li>
          <li>Frozen Ready-to-Cook Meals</li>
          <li>Traditional Cooking Utensils</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Fresh Deliveries</h3>
        <p>We receive fresh shipments weekly, ensuring you always have access to the freshest ingredients for your Nepalese cooking.</p>
        
        <h3 class="text-lg font-semibold">Special Orders</h3>
        <p>Can't find what you're looking for? We take special orders for specific items. Just ask our friendly staff for assistance.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'nepali-mart-canberra',
    name: 'Nepali Mart Canberra',
    description:
      'Wide range of Nepalese and South Asian groceries and household items.',
    location: 'Gungahlin, Canberra',
    city: 'Canberra',
    phone: '0410 683 450',
    image: '/business/nepali-mart.jpg',
    hours: 'Tue-Sun 9 AM – 6 PM, Closed Mon',
    category: 'grocery',
    details: `
      <div class="space-y-4">
        <p>Nepali Mart Canberra offers the largest selection of Nepalese groceries and household items in the region, serving the community with authentic products from Nepal.</p>
        
        <h3 class="text-lg font-semibold">Our Products</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Extensive Range of Dry Goods</li>
          <li>Nepalese Spices and Condiments</li>
          <li>Traditional Snacks and Sweets</li>
          <li>Frozen Foods and Ready Meals</li>
          <li>Household Items and Cookware</li>
          <li>Religious and Cultural Items</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Community Focus</h3>
        <p>We pride ourselves on supporting the local Nepalese community by stocking hard-to-find items and creating a taste of home for those far from Nepal.</p>
        
        <h3 class="text-lg font-semibold">Bulk Orders</h3>
        <p>We offer special pricing for bulk orders for restaurants, events, and large gatherings. Contact us for details.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'kopila-grocery',
    name: 'Kopila Grocery Store',
    description:
      'Local grocery with a good variety of Nepalese food staples and fresh goods.',
    location: 'Phillip, Canberra',
    city: 'Canberra',
    phone: '0466 545 048',
    image: '/business/kopila-grocery.png',
    website: 'kopilagrocery.com.au',
    hours: 'Mon-Sat 8 AM – 8 PM, Sun 9 AM – 6 PM',
    category: 'grocery',
    details: `
      <div class="space-y-4">
        <p>Kopila Grocery Store provides a wide selection of Nepalese food staples, fresh produce, and specialty items to the Canberra community.</p>
        
        <h3 class="text-lg font-semibold">Store Highlights</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Fresh Vegetables and Fruits</li>
          <li>Authentic Nepalese Spices and Lentils</li>
          <li>Imported Snacks and Sweets</li>
          <li>Frozen Ready-to-Cook Items</li>
          <li>Traditional Cooking Ingredients</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Extended Hours</h3>
        <p>We offer extended operating hours to accommodate our customers' busy schedules, making it convenient to shop for your Nepalese grocery needs.</p>
        
        <h3 class="text-lg font-semibold">Weekly Specials</h3>
        <p>Check our website or visit our store for weekly specials and promotions on selected items.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  // Add more grocery stores, salons, consultancies, etc.
  // Salons
  {
    id: 'kathmandu-beauty-salon',
    name: 'Kathmandu Beauty and Hair Salon',
    description:
      'A full-service beauty and hair salon specializing in modern cuts, traditional Nepali beauty treatments, and bridal styling.',
    location: 'Gungahlin, Canberra',
    city: 'Canberra',
    phone: '0455 529 980',
    image: '/business/kathmandu-beauty.jpg',
    website: 'ktmbeauty.com.au',
    hours: 'Mon-Fri: 9 AM – 6 PM, Sat: 9 AM – 4 PM, Sun: Closed',
    category: 'salon',
    details: `
      <div class="space-y-4">
        <p>Kathmandu Beauty and Hair Salon brings the best of Nepali beauty traditions and modern styling techniques to Canberra.</p>
        
        <h3 class="text-lg font-semibold">Our Services</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Hair Cutting, Styling, and Coloring</li>
          <li>Traditional Nepali Threading and Eyebrow Shaping</li>
          <li>Facials and Skincare Treatments</li>
          <li>Bridal Makeup and Styling</li>
          <li>Henna Art and Traditional Adornments</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Bridal Packages</h3>
        <p>We specialize in bridal styling for Nepali weddings, offering complete packages that blend traditional elements with contemporary styles.</p>
        
        <h3 class="text-lg font-semibold">Products</h3>
        <p>We use and sell a range of high-quality hair and beauty products, including some specialty items imported from Nepal.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'desi-dude-salon',
    name: 'Desi Dude Hair Salon',
    description:
      "Popular men's grooming and styling salon offering haircuts, shaves, and beard trims with a casual and friendly vibe.",
    location: 'Phillip, Canberra',
    city: 'Canberra',
    phone: '0451 962 672',
    image: '/business/desi-dude.png',
    hours: 'Tue-Sat: 10 AM – 7 PM, Sun-Mon: Closed',
    category: 'salon',
    details: `
      <div class="space-y-4">
        <p>Desi Dude Hair Salon is Canberra's go-to destination for men's grooming, offering professional haircuts, beard trims, and styling in a relaxed, friendly environment.</p>
        
        <h3 class="text-lg font-semibold">Services</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Precision Haircuts</li>
          <li>Beard Trimming and Styling</li>
          <li>Traditional Hot Towel Shaves</li>
          <li>Hair Coloring and Treatments</li>
          <li>Facial Grooming</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Atmosphere</h3>
        <p>Our salon offers a casual, welcoming vibe where you can relax, enjoy good conversation, and leave looking your best.</p>
        
        <h3 class="text-lg font-semibold">Walk-ins Welcome</h3>
        <p>While appointments are recommended for guaranteed service, we welcome walk-ins and do our best to accommodate all customers with minimal wait times.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  {
    id: 'sumitra-joshi',
    name: 'Sumitra Joshi Hair and Makeup',
    description:
      'Renowned beauty therapist specializing in skincare, makeup, and wellness treatments with a personalized touch.',
    location: 'Taylor, Canberra',
    city: 'Canberra',
    phone: '0424 814 063',
    image: '/placeholder.svg?height=400&width=600',
    website: 'sumitrajoshi.com',
    hours: 'Mon-Fri: 9 AM – 5 PM, Sat-Sun: By appointment only',
    category: 'salon',
    details: `
      <div class="space-y-4">
        <p>Sumitra Joshi offers personalized beauty and wellness services with a holistic approach, combining traditional Nepali beauty practices with modern techniques.</p>
        
        <h3 class="text-lg font-semibold">Specialized Services</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Customized Facial Treatments</li>
          <li>Professional Makeup Application</li>
          <li>Traditional Ayurvedic Skincare</li>
          <li>Bridal and Special Occasion Styling</li>
          <li>Wellness and Relaxation Therapies</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Personalized Approach</h3>
        <p>Each client receives a personalized consultation and treatment plan tailored to their specific needs and goals.</p>
        
        <h3 class="text-lg font-semibold">Appointment Only</h3>
        <p>To ensure dedicated, one-on-one attention for each client, services are available by appointment only. Weekend appointments are available for special occasions.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  // Consultancies
  {
    id: 'himalayan-business-group',
    name: 'Himalayan Business Group',
    description:
      'Business consulting and advisory services catering to Nepali entrepreneurs and startups in Australia.',
    location: 'Moore St, Canberra',
    city: 'Canberra',
    phone: '0481 372 322',
    image: '/business/himalayan-business.png',
    website: 'himalayanbusiness.com',
    hours: 'Mon-Fri: 9 AM – 6 PM, Sat-Sun: Closed',
    category: 'consultancy',
    details: `
      <div class="space-y-4">
        <p>Himalayan Business Group provides comprehensive business consulting services to help Nepali entrepreneurs establish and grow their businesses in Australia.</p>
        
        <h3 class="text-lg font-semibold">Our Services</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Business Plan Development</li>
          <li>Market Entry Strategy</li>
          <li>Financial Planning and Analysis</li>
          <li>Business Registration and Compliance</li>
          <li>Marketing and Growth Strategies</li>
          <li>Networking and Business Connections</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Industry Expertise</h3>
        <p>We have specialized knowledge in hospitality, retail, and service industries, with a focus on helping Nepali businesses navigate the Australian market.</p>
        
        <h3 class="text-lg font-semibold">Consultation Process</h3>
        <p>We offer a free initial consultation to understand your business needs, followed by tailored advisory services to help you achieve your goals.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  // Automotive
  {
    id: 'kathmandu-automotive',
    name: 'Kathmandu Automotive',
    description:
      'Automotive repair and maintenance services with expertise in all vehicle types, serving the Canberra community.',
    location: 'Canberra',
    city: 'Canberra',
    image: '/business/kathmandu-automotive.jpg',
    website: 'kathmanduautomotive.net',
    hours: 'Mon-Fri: 8 AM – 5 PM, Sat: 8 AM – 12 PM, Sun: Closed',
    category: 'automotive',
    details: `
      <div class="space-y-4">
        <p>Kathmandu Automotive provides reliable, professional automotive repair and maintenance services to the Canberra community, with a focus on quality workmanship and customer satisfaction.</p>
        
        <h3 class="text-lg font-semibold">Our Services</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>General Repairs and Maintenance</li>
          <li>Logbook Servicing</li>
          <li>Brake and Suspension Work</li>
          <li>Engine Diagnostics and Repairs</li>
          <li>Electrical System Services</li>
          <li>Pre-Purchase Inspections</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Our Approach</h3>
        <p>We pride ourselves on honest, transparent service with clear explanations of all work needed and fair pricing for all our customers.</p>
        
        <h3 class="text-lg font-semibold">Qualified Technicians</h3>
        <p>Our team consists of fully qualified mechanics with extensive experience working on all makes and models of vehicles.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },
  // Others

  {
    id: 'united-pay-remit',
    name: 'United Pay Remit',
    description:
      'Fast, secure, and compliant money transfers from Australia to Nepal.',
    location: 'Sydney, NSW, Australia',
    city: 'Canberra',
    phone: '1300 682 262',
    image: '/business/unitedpay.jpg', // Replace with actual image
    hours: 'Mon–Fri 9 AM – 6 PM (AEST), Sat by appointment',
    category: 'other',
    website: 'https://unitedpayremit.com.au',
    details: `
      <div class="space-y-4">
        <p><strong>United Pay Remit</strong> is an Australian-registered remittance service (ABN 72 677 422 178, ASIC-incorporated May 16, 2024) offering secure money transfers to Nepal via officially licensed channels.</p>
  
        <h3 class="text-lg font-semibold">✅ Why Choose United Pay Remit?</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Authorized by Nepal Rastra Bank and AUSTRAC-compliant</li>
          <li>Competitive exchange rates and low fees</li>
          <li>Instant bank deposits across major Nepali banks</li>
          <li>Online service with support via English & Nepali</li>
          <li>Launched mid‑2025, led by investment from Nepalese banking professionals :contentReference[oaicite:1]{index=1}</li>
        </ul>
  
        <h3 class="text-lg font-semibold">📌 How It Works</h3>
        <p>Begin at <a class="underline text-blue-600" href="https://unitedpayremit.com.au" target="_blank">unitedpayremit.com.au</a>. Register, select transfer amount, pay via EFT, and the recipient receives funds—typically instantly or within hours.</p>
  
        <h3 class="text-lg font-semibold">📞 Get in Touch</h3>
        <p>Call 1300 682 262 or visit the website for live chat support in English & Nepali.</p>
      </div>
    `,
    latitude: -35.3,
    longitude: 149.1,
  },

  {
    id: 'sanatan-samaj',
    name: 'Sanatan Samaj Australia',
    description:
      'Community organization promoting Nepali Hindu culture, religious events, and social welfare activities.',
    location: 'Bonner, Canberra',
    city: 'Canberra',
    phone: '0433 677 022',
    image: '/business/ssa.jpg',
    website: 'sanatansamajaustralia.org',
    hours: 'Call to confirm event times',
    category: 'other',
    details: `
      <div class="space-y-4">
        <p>Sanatan Samaj Australia is a community organization dedicated to preserving and promoting Nepali Hindu culture, traditions, and values within the Australian community.</p>
        
        <h3 class="text-lg font-semibold">Our Mission</h3>
        <p>We aim to create a supportive community for Nepali Hindus in Australia while sharing our rich cultural heritage with the broader Australian society.</p>
        
        <h3 class="text-lg font-semibold">Activities and Events</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Religious Ceremonies and Festivals</li>
          <li>Cultural Programs and Performances</li>
          <li>Language and Cultural Classes</li>
          <li>Community Support Services</li>
          <li>Charitable and Welfare Activities</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Get Involved</h3>
        <p>We welcome community members to join our organization, participate in our events, or volunteer for our various initiatives. Contact us to learn more about membership and upcoming events.</p>
      </div>
    `,
    latitude: -35.1833,
    longitude: 149.1511,
  },
  {
    id: 'mountain-yeti-brewing',
    name: 'Mountain Yeti Brewing Co.',
    description:
      'Craft brewery offering a selection of Nepali-inspired beers and beverages with tasting room events.',
    location: 'Canberra',
    city: 'Canberra',
    phone: '(61) 451-164-123',
    image: '/business/mountain-yeti.jpg',
    website: 'mountainyeti.com.au',
    hours: 'Wed-Sun: 12 PM – 9 PM, Mon-Tue: Closed',
    category: 'other',
    details: `
      <div class="space-y-4">
        <p>Mountain Yeti Brewing Co. is Canberra's first Nepali-inspired craft brewery, creating unique beers that blend Australian brewing techniques with Himalayan flavors and traditions.</p>
        
        <h3 class="text-lg font-semibold">Our Beers</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li>Himalayan Pale Ale - Our flagship IPA with notes of Nepali spices</li>
          <li>Sherpa Stout - Rich, dark stout with hints of Himalayan coffee</li>
          <li>Kathmandu Kolsch - Light, refreshing beer perfect for summer</li>
          <li>Everest Porter - Robust porter with chocolate and cardamom notes</li>
          <li>Seasonal and Limited Releases</li>
        </ul>
        
        <h3 class="text-lg font-semibold">Tasting Room</h3>
        <p>Visit our tasting room to sample our full range of beers, enjoy Nepali-inspired bar snacks, and learn about our brewing process.</p>
        
        <h3 class="text-lg font-semibold">Events</h3>
        <p>We regularly host beer tasting events, brewing workshops, and cultural nights. Check our website or social media for upcoming events.</p>
      </div>
    `,
    latitude: -35.2809,
    longitude: 149.13,
  },

  // EVENTS
  {
    id: 'whats-happening-australia',
    name: 'What’s Happening Australia',
    description:
      'A community platform showcasing Nepali events, local deals, and businesses in Australia.',
    location: 'Canberra & Sydney',
    city: 'Canberra',
    phone: 'info@whatshappeningaustralia.com',
    image: '/business/wha-banner-mb.png',
    website: 'https://whatshappeningaustralia.com',
    hours: 'Mon–Sun , 24 hrs ',
    category: 'event',
    details: `
      <div class="space-y-4">
        <p><strong>What’s Happening Australia</strong> is your dedicated platform to explore what's going on in the Nepali community across Canberra, Sydney, and beyond.</p>
  
        <h3 class="text-lg font-semibold">What We Offer</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>Events:</strong> Discover upcoming cultural programs, concerts, community meetups, and movie screenings</li>
          <li><strong>Deals:</strong> Unlock exclusive discounts and offers from your favourite Nepali-owned local businesses</li>
          <li><strong>Business Directory:</strong> Browse verified Nepali-run businesses, from restaurants to beauty salons and beyond</li>
          <li><strong>Local Highlights:</strong> Stay informed with stories, interviews, and community updates</li>
        </ul>
  
        <h3 class="text-lg font-semibold">Support Nepali Businesses</h3>
        <p>Our mission is to uplift and promote Nepali-owned businesses and cultural events while keeping the community informed and engaged.</p>
  
        <h3 class="text-lg font-semibold">Get Listed</h3>
        <p>If you’re a business owner or event organizer, list with us to gain more visibility and connect with your community. Reach out today to get featured.</p>
      </div>
    `,
    latitude: -35.2809,
    longitude: 149.13,
  },
];

export function getBusinesses(): Business[] {
  return businesses;
}

export function getBusinessById(id: string): Business | undefined {
  return businesses.find((business) => business.id === id);
}

export function getBusinessesByCategory(category: string): Business[] {
  if (category === 'all') {
    return businesses;
  }
  return businesses.filter((business) => business.category === category);
}

export function getUniqueCities(): string[] {
  const cities = businesses
    .map((business) => business.city)
    .filter((city): city is string => Boolean(city));
  return [...new Set(cities)].sort();
}

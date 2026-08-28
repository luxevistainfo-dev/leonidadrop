window.ITEMS = [
  { id: "spray", name: "Strip Cans", cat: "wear", rarity: "common", usd: 3, img: "images/item-spray.jpg", blurb: "Three colors. One wall that was never yours." },
  { id: "tank", name: "Palm Tank", cat: "wear", rarity: "common", usd: 4, img: "images/item-tank.jpg", blurb: "Sweat, salt, and a night that started too early." },
  { id: "float", name: "Pool Flamingo", cat: "wear", rarity: "common", usd: 5, img: "images/item-float.jpg", blurb: "Inflatable alibi for a penthouse that is not yours yet." },
  { id: "radio", name: "Night Deck", cat: "wear", rarity: "common", usd: 6, img: "images/item-radio.jpg", blurb: "A cassette loud enough to drown the causeway." },
  { id: "cap", name: "Flamingo Cap", cat: "wear", rarity: "common", usd: 7, img: "images/item-cap.jpg", blurb: "Gold pin. Pink brim. Face half-hidden." },
  { id: "billboard", name: "Vice Strip Claim", cat: "place", rarity: "common", usd: 8, img: "images/loc-vice.jpg", blurb: "A slice of neon you can hold in a locker." },
  { id: "sneakers", name: "Causeway Runners", cat: "wear", rarity: "uncommon", usd: 9, img: "images/item-sneakers.jpg", blurb: "Built for wet asphalt and a bad idea." },
  { id: "club", name: "Rope Pass", cat: "place", rarity: "uncommon", usd: 12, img: "images/item-club.jpg", blurb: "Velvet rope. Gold band. Your name is not on the list — the token is." },
  { id: "shades", name: "After Hours Shades", cat: "wear", rarity: "uncommon", usd: 14, img: "images/item-shades.jpg", blurb: "Gold frames. Magenta lie. Morning denied." },
  { id: "hoodie", name: "Magenta Hood", cat: "wear", rarity: "uncommon", usd: 15, img: "images/item-hoodie.jpg", blurb: "Heavyweight. Teal cords. Hood up before the cameras." },
  { id: "camp", name: "Grassrivers Camp", cat: "place", rarity: "uncommon", usd: 16, img: "images/loc-swamp.jpg", blurb: "Sawgrass, black water, nobody looking." },
  { id: "portlot", name: "Port Lot", cat: "place", rarity: "uncommon", usd: 19, img: "images/loc-port.jpg", blurb: "Cranes, rust, and a car that should not be there." },
  { id: "jacket", name: "Magenta Bomber", cat: "wear", rarity: "rare", usd: 22, img: "images/item-jacket.jpg", blurb: "Satin that catches every bar sign on the strip." },
  { id: "grill", name: "Port Grill", cat: "wear", rarity: "rare", usd: 26, img: "images/item-grill.jpg", blurb: "Gold in the mouth. The smile is optional." },
  { id: "dock", name: "Keys Dock Slip", cat: "place", rarity: "rare", usd: 29, img: "images/loc-keys.jpg", blurb: "Turquoise water. One slip. Yours on-chain." },
  { id: "dirt", name: "Warehouse Dirt Bike", cat: "ride", rarity: "rare", usd: 34, img: "images/item-dirt.jpg", blurb: "Magenta pinstripe. No number plate. No questions." },
  { id: "gold", name: "Port Chain", cat: "wear", rarity: "rare", usd: 38, img: "images/item-gold.jpg", blurb: "Cuban gold and a watch that never tells the truth." },
  { id: "buggy", name: "Glow Buggy", cat: "ride", rarity: "rare", usd: 44, img: "images/item-buggy.jpg", blurb: "Lifted. Underlit. Mud still wet from Grassrivers." },
  { id: "bike", name: "Neon Cafe Racer", cat: "ride", rarity: "rare", usd: 48, img: "images/item-bike.jpg", blurb: "Chrome, magenta pinstripe, no witnesses." },
  { id: "jetski", name: "Keys Jet Ski", cat: "ride", rarity: "epic", usd: 58, img: "images/item-jetski.jpg", blurb: "Teal hull. Magenta running lights. Gone before the wake settles." },
  { id: "car", name: "Pink Hour Convertible", cat: "ride", rarity: "epic", usd: 79, img: "images/item-car.jpg", blurb: "The car the causeway was poured for." },
  { id: "boat", name: "Keys Speedboat", cat: "ride", rarity: "epic", usd: 88, img: "images/item-boat.jpg", blurb: "Fast enough to leave the county before the radio catches up." },
  { id: "penthouse", name: "Skyline Key", cat: "place", rarity: "epic", usd: 99, img: "images/item-penthouse.jpg", blurb: "Glass, marble, and the whole city lying under you." },
  { id: "villa", name: "Palm Villa", cat: "place", rarity: "legend", usd: 160, img: "images/item-villa.jpg", blurb: "Glass, pool, palms. A quiet house that is never quiet." },
  { id: "yacht", name: "Sunburn Yacht", cat: "ride", rarity: "legend", usd: 240, img: "images/item-yacht.jpg", blurb: "A floating alibi with teal deck lights." },
  { id: "heli", name: "Roof Hopper", cat: "ride", rarity: "legend", usd: 310, img: "images/item-heli.jpg", blurb: "Leave the strip from the roof. Land wherever the night still pays." }
];

window.CRATES = [
  {
    id: "street",
    name: "Street Drop",
    usd: 7,
    img: "images/crate-street.jpg",
    blurb: "What the sidewalk leaves behind.",
    pool: [
      ["spray", 20], ["tank", 18], ["float", 14], ["radio", 14], ["cap", 12], ["sneakers", 10], ["hoodie", 8], ["jacket", 4]
    ]
  },
  {
    id: "keys",
    name: "Keys Drop",
    usd: 25,
    img: "images/crate-street.jpg",
    blurb: "Salt air and something you should not have won.",
    pool: [
      ["shades", 16], ["club", 14], ["hoodie", 12], ["dock", 12], ["dirt", 12], ["grill", 10], ["gold", 10], ["jetski", 8], ["car", 6]
    ]
  },
  {
    id: "vice",
    name: "Vice Drop",
    usd: 65,
    img: "images/crate-legend.jpg",
    blurb: "The strip plays favorites. Sometimes it is you.",
    pool: [
      ["gold", 16], ["buggy", 14], ["bike", 14], ["jetski", 14], ["car", 12], ["boat", 12], ["penthouse", 10], ["villa", 8]
    ]
  },
  {
    id: "legend",
    name: "Legend Drop",
    usd: 180,
    img: "images/crate-legend.jpg",
    blurb: "One crate. One night. No refunds from the sun.",
    pool: [
      ["car", 24], ["boat", 20], ["penthouse", 18], ["villa", 16], ["yacht", 14], ["heli", 8]
    ]
  }
];

window.itemById = (id) => window.ITEMS.find((x) => x.id === id);

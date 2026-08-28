window.ITEMS = [
  { id: "tank", name: "Palm Tank", cat: "wear", rarity: "common", usd: 4, img: "images/item-tank.jpg", blurb: "Sweat, salt, and a night that started too early." },
  { id: "radio", name: "Night Deck", cat: "wear", rarity: "common", usd: 6, img: "images/item-radio.jpg", blurb: "A cassette loud enough to drown the causeway." },
  { id: "sneakers", name: "Causeway Runners", cat: "wear", rarity: "uncommon", usd: 9, img: "images/item-sneakers.jpg", blurb: "Built for wet asphalt and a bad idea." },
  { id: "billboard", name: "Vice Strip Claim", cat: "place", rarity: "common", usd: 8, img: "images/loc-vice.jpg", blurb: "A slice of neon you can hold in a locker." },
  { id: "shades", name: "After Hours Shades", cat: "wear", rarity: "uncommon", usd: 14, img: "images/item-shades.jpg", blurb: "Gold frames. Magenta lie. Morning denied." },
  { id: "camp", name: "Grassrivers Camp", cat: "place", rarity: "uncommon", usd: 16, img: "images/loc-swamp.jpg", blurb: "Sawgrass, black water, nobody looking." },
  { id: "portlot", name: "Port Lot", cat: "place", rarity: "uncommon", usd: 19, img: "images/loc-port.jpg", blurb: "Cranes, rust, and a car that should not be there." },
  { id: "jacket", name: "Magenta Bomber", cat: "wear", rarity: "rare", usd: 22, img: "images/item-jacket.jpg", blurb: "Satin that catches every bar sign on the strip." },
  { id: "dock", name: "Keys Dock Slip", cat: "place", rarity: "rare", usd: 29, img: "images/loc-keys.jpg", blurb: "Turquoise water. One slip. Yours on-chain." },
  { id: "gold", name: "Port Chain", cat: "wear", rarity: "rare", usd: 38, img: "images/item-gold.jpg", blurb: "Cuban gold and a watch that never tells the truth." },
  { id: "bike", name: "Neon Cafe Racer", cat: "ride", rarity: "rare", usd: 48, img: "images/item-bike.jpg", blurb: "Chrome, magenta pinstripe, no witnesses." },
  { id: "car", name: "Pink Hour Convertible", cat: "ride", rarity: "epic", usd: 79, img: "images/item-car.jpg", blurb: "The car the causeway was poured for." },
  { id: "boat", name: "Keys Speedboat", cat: "ride", rarity: "epic", usd: 88, img: "images/item-boat.jpg", blurb: "Fast enough to leave the county before the radio catches up." },
  { id: "penthouse", name: "Skyline Key", cat: "place", rarity: "epic", usd: 99, img: "images/item-penthouse.jpg", blurb: "Glass, marble, and the whole city lying under you." },
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
      ["tank", 28], ["radio", 22], ["sneakers", 18], ["billboard", 16], ["shades", 10], ["jacket", 6]
    ]
  },
  {
    id: "keys",
    name: "Keys Drop",
    usd: 25,
    img: "images/crate-street.jpg",
    blurb: "Salt air and something you should not have won.",
    pool: [
      ["shades", 22], ["camp", 18], ["dock", 16], ["jacket", 16], ["gold", 12], ["bike", 10], ["car", 6]
    ]
  },
  {
    id: "vice",
    name: "Vice Drop",
    usd: 65,
    img: "images/crate-legend.jpg",
    blurb: "The strip plays favorites. Sometimes it is you.",
    pool: [
      ["gold", 22], ["bike", 20], ["car", 18], ["boat", 16], ["penthouse", 14], ["yacht", 10]
    ]
  },
  {
    id: "legend",
    name: "Legend Drop",
    usd: 180,
    img: "images/crate-legend.jpg",
    blurb: "One crate. One night. No refunds from the sun.",
    pool: [
      ["car", 28], ["boat", 24], ["penthouse", 22], ["yacht", 16], ["heli", 10]
    ]
  }
];

window.itemById = (id) => window.ITEMS.find((x) => x.id === id);

const express = require("express");
const axios = require("axios");

const router = express.Router();


// =====================================================
// COMMON INDIAN CITIES → MAIN RAILWAY STATION CODE
// =====================================================

const stationCodes = {

  // Karnataka
  bengaluru: { code: "SBC", name: "KSR Bengaluru" },
  bangalore: { code: "SBC", name: "KSR Bengaluru" },
  hospet: { code: "HPT", name: "Hosapete Junction" },
  hosapete: { code: "HPT", name: "Hosapete Junction" },
  mysuru: { code: "MYS", name: "Mysuru Junction" },
  mysore: { code: "MYS", name: "Mysuru Junction" },
  mangalore: { code: "MAQ", name: "Mangaluru Central" },
  mangaluru: { code: "MAQ", name: "Mangaluru Central" },
  hubli: { code: "UBL", name: "Hubballi Junction" },
  hubballi: { code: "UBL", name: "Hubballi Junction" },
  belagavi: { code: "BGM", name: "Belagavi" },
  belgaum: { code: "BGM", name: "Belagavi" },

  // Tamil Nadu
  chennai: { code: "MAS", name: "Chennai Central" },
  coimbatore: { code: "CBE", name: "Coimbatore Junction" },
  madurai: { code: "MDU", name: "Madurai Junction" },
  salem: { code: "SA", name: "Salem Junction" },
  trichy: { code: "TPJ", name: "Tiruchchirappalli Junction" },
  tiruchirappalli: { code: "TPJ", name: "Tiruchchirappalli Junction" },

  // Telangana
  hyderabad: { code: "SC", name: "Secunderabad Junction" },
  secunderabad: { code: "SC", name: "Secunderabad Junction" },

  // Andhra Pradesh
  vijayawada: { code: "BZA", name: "Vijayawada Junction" },
  visakhapatnam: { code: "VSKP", name: "Visakhapatnam" },
  vizag: { code: "VSKP", name: "Visakhapatnam" },
  tirupati: { code: "TPTY", name: "Tirupati" },

  // Maharashtra
  mumbai: { code: "CSMT", name: "Chhatrapati Shivaji Maharaj Terminus" },
  pune: { code: "PUNE", name: "Pune Junction" },
  nagpur: { code: "NGP", name: "Nagpur Junction" },
  nashik: { code: "NK", name: "Nashik Road" },
  aurangabad: { code: "AWB", name: "Aurangabad" },

  // Delhi
  delhi: { code: "NDLS", name: "New Delhi" },
  newdelhi: { code: "NDLS", name: "New Delhi" },

  // West Bengal
  kolkata: { code: "HWH", name: "Howrah Junction" },
  howrah: { code: "HWH", name: "Howrah Junction" },
  sealdah: { code: "SDAH", name: "Sealdah" },

  // Gujarat
  ahmedabad: { code: "ADI", name: "Ahmedabad Junction" },
  surat: { code: "ST", name: "Surat" },
  vadodara: { code: "BRC", name: "Vadodara Junction" },
  rajkot: { code: "RJT", name: "Rajkot Junction" },

  // Rajasthan
  jaipur: { code: "JP", name: "Jaipur Junction" },
  jodhpur: { code: "JU", name: "Jodhpur Junction" },
  udaipur: { code: "UDZ", name: "Udaipur City" },
  kota: { code: "KOTA", name: "Kota Junction" },

  // Uttar Pradesh
  lucknow: { code: "LKO", name: "Lucknow" },
  kanpur: { code: "CNB", name: "Kanpur Central" },
  varanasi: { code: "BSB", name: "Varanasi Junction" },
  agra: { code: "AGC", name: "Agra Cantt" },
  prayagraj: { code: "PRYJ", name: "Prayagraj Junction" },

  // Bihar
  patna: { code: "PNBE", name: "Patna Junction" },
  gaya: { code: "GAYA", name: "Gaya Junction" },

  // Madhya Pradesh
  bhopal: { code: "BPL", name: "Bhopal Junction" },
  indore: { code: "INDB", name: "Indore Junction" },
  jabalpur: { code: "JBP", name: "Jabalpur Junction" },

  // Odisha
  bhubaneswar: { code: "BBS", name: "Bhubaneswar" },
  puri: { code: "PURI", name: "Puri" },
  cuttack: { code: "CTC", name: "Cuttack Junction" },

  // Kerala
  kochi: { code: "ERS", name: "Ernakulam Junction" },
  ernakulam: { code: "ERS", name: "Ernakulam Junction" },
  trivandrum: { code: "TVC", name: "Thiruvananthapuram Central" },
  thiruvananthapuram: {
    code: "TVC",
    name: "Thiruvananthapuram Central"
  },
  kozhikode: { code: "CLT", name: "Kozhikode" },

  // Goa
  goa: { code: "MAO", name: "Madgaon Junction" },
  madgaon: { code: "MAO", name: "Madgaon Junction" },

  // Punjab
  amritsar: { code: "ASR", name: "Amritsar Junction" },
  ludhiana: { code: "LDH", name: "Ludhiana Junction" },

  // Assam
  guwahati: { code: "GHY", name: "Guwahati" },

  // Jharkhand
  ranchi: { code: "RNC", name: "Ranchi Junction" },

  // Chhattisgarh
  raipur: { code: "R", name: "Raipur Junction" }

};


// =====================================================
// STATION SEARCH / AUTOCOMPLETE
// GET: /api/trains/stations?q=hosp
// =====================================================

router.get("/stations", async (req, res) => {

  try {

    const query = (req.query.q || "")
      .trim()
      .toLowerCase();

    if (!query) {
      return res.json({
        success: true,
        data: []
      });
    }

    const results = Object.entries(stationCodes)
      .filter(([city, station]) => {

        return (
          city.includes(query) ||
          station.name.toLowerCase().includes(query) ||
          station.code.toLowerCase().includes(query)
        );

      })
      .map(([city, station]) => ({
        city: city,
        name: station.name,
        code: station.code
      }));


    // Remove duplicate station codes
    const uniqueResults = results.filter(
      (station, index, self) =>
        index === self.findIndex(
          (item) => item.code === station.code
        )
    );


    console.log(
      `Station search: ${query}`,
      uniqueResults
    );


    res.json({
      success: true,
      data: uniqueResults.slice(0, 10)
    });

  } catch (error) {

    console.error(
      "Station search error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to search stations"
    });

  }

});


// =====================================================
// SEARCH TRAINS
// GET: /api/trains/search?from=Hospet&to=Bengaluru
// =====================================================

router.get("/search", async (req, res) => {

  try {

    const { from, to, date } = req.query;


    if (!from || !to) {

      return res.status(400).json({
        success: false,
        message: "Please enter From and To stations"
      });

    }


    const fromInput = from.trim().toLowerCase();
    const toInput = to.trim().toLowerCase();


    // Convert city/station name to railway code
    const fromCode =
      stationCodes[fromInput]?.code ||
      from.trim().toUpperCase();

    const toCode =
      stationCodes[toInput]?.code ||
      to.trim().toUpperCase();


    console.log(
      `Searching trains: ${fromCode} → ${toCode}`
    );


    const apiKey =
      process.env.RAILRADAR_API_KEY;


    if (!apiKey) {

      return res.status(500).json({
        success: false,
        message: "RailRadar API key is missing"
      });

    }


    const url =
      `https://railradar.in/api/v1/trains/between/` +
      `${encodeURIComponent(fromCode)}/` +
      `${encodeURIComponent(toCode)}`;


    const response = await axios.get(url, {

      headers: {

        Authorization: `Bearer ${apiKey}`,

        Accept: "application/json"

      },

      params: date
        ? { date }
        : {}

    });


    console.log(
      "RailRadar response received"
    );


    res.json(response.data);


  } catch (error) {

    console.error(
      "RailRadar Error:",
      error.response?.data ||
      error.message
    );


    res.status(
      error.response?.status || 500
    ).json({

      success: false,

      message:
        "Unable to fetch real train data",

      error:
        error.response?.data ||
        error.message

    });

  }

});


module.exports = router;
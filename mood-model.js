/* Mindful Day — authored moods, five color identities, three bounded variants.
 * Background is part of the mood. See docs/COLOR-MODEL.md.
 * No global word scoring: recipe + selection + semantic variant -> finite word.
 */
(function(root){'use strict';
const MOODS=[
  {
    "id": "joy",
    "name": "기쁜",
    "en": "Joyful",
    "word": "joyful",
    "background": {
      "id": "joy",
      "color": "#e7d9bb",
      "name": "햇살 모래",
      "en": "Sunlit sand",
      "dark": false
    },
    "palettes": [
      {
        "id": "joy.red",
        "color": "red",
        "tag": "warm",
        "name": "빨강",
        "en": "Red",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#ffe1db",
              "#ffd8cf",
              "#ffcb9e",
              "#ffca94"
            ],
            "word": "glad"
          },
          {
            "id": "soft",
            "colors": [
              "#f7dbcf",
              "#e6828c",
              "#cf6694",
              "#eac4aa"
            ],
            "word": "fond"
          },
          {
            "id": "bold",
            "colors": [
              "#ffc6ae",
              "#f95567",
              "#e03b84",
              "#db9d32"
            ],
            "word": "delighted"
          }
        ]
      },
      {
        "id": "joy.yellow",
        "color": "yellow",
        "tag": "sunny",
        "name": "노랑",
        "en": "Yellow",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#ffb765",
              "#ffc353",
              "#ffe44d",
              "#fbff8c"
            ],
            "word": "sunny"
          },
          {
            "id": "soft",
            "colors": [
              "#f3e8b5",
              "#dabf60",
              "#c07d49",
              "#c4958c"
            ],
            "word": "pleased"
          },
          {
            "id": "bold",
            "colors": [
              "#ffea8f",
              "#f0c630",
              "#c96e26",
              "#6f3b6b"
            ],
            "word": "elated"
          }
        ]
      },
      {
        "id": "joy.blue",
        "color": "blue",
        "tag": "fresh",
        "name": "파랑",
        "en": "Blue",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#c3e7f3",
              "#5ab8e0",
              "#5378c6",
              "#98d8f3"
            ],
            "word": "fresh"
          },
          {
            "id": "soft",
            "colors": [
              "#d1e9f2",
              "#70b8d7",
              "#6683bf",
              "#b89aba"
            ],
            "word": "buoyant"
          },
          {
            "id": "bold",
            "colors": [
              "#b4e5f5",
              "#45b7e8",
              "#416dcb",
              "#efb544"
            ],
            "word": "invigorated"
          }
        ]
      },
      {
        "id": "joy.green",
        "color": "green",
        "tag": "hopeful",
        "name": "초록",
        "en": "Green",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#d6e8aa",
              "#8dbf69",
              "#3c9d87",
              "#8ce1bd"
            ],
            "word": "hopeful"
          },
          {
            "id": "soft",
            "colors": [
              "#d9e6b9",
              "#95bc79",
              "#499d8a",
              "#bcae87"
            ],
            "word": "receptive"
          },
          {
            "id": "bold",
            "colors": [
              "#d3ea9b",
              "#85c25a",
              "#329a83",
              "#e2a537"
            ],
            "word": "uplifted"
          }
        ]
      },
      {
        "id": "joy.purple",
        "color": "purple",
        "tag": "playful",
        "name": "보라",
        "en": "Purple",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#e4cef2",
              "#b480d8",
              "#8b4bbb",
              "#efb5df"
            ],
            "word": "playful"
          },
          {
            "id": "soft",
            "colors": [
              "#e9dbf2",
              "#b891d4",
              "#905eb5",
              "#b6c2a1"
            ],
            "word": "enchanted"
          },
          {
            "id": "bold",
            "colors": [
              "#dfc1f2",
              "#af70dc",
              "#863cbd",
              "#d5b036"
            ],
            "word": "exuberant"
          }
        ]
      }
    ],
    "combinations": {
      "0": {
        "base": "glad",
        "soft": "glad",
        "bold": "delighted"
      },
      "1": {
        "base": "sunny",
        "soft": "sunny",
        "bold": "elated"
      },
      "2": {
        "base": "fresh",
        "soft": "fresh",
        "bold": "invigorated"
      },
      "3": {
        "base": "hopeful",
        "soft": "hopeful",
        "bold": "uplifted"
      },
      "4": {
        "base": "playful",
        "soft": "playful",
        "bold": "exuberant"
      },
      "0+1": {
        "base": "cheerful",
        "soft": "cheerful",
        "bold": "cheerful"
      },
      "0+2": {
        "base": "pleased",
        "soft": "pleased",
        "bold": "cheerful"
      },
      "0+3": {
        "base": "uplifted",
        "soft": "uplifted",
        "bold": "uplifted"
      },
      "0+4": {
        "base": "amused",
        "soft": "amused",
        "bold": "amused"
      },
      "1+2": {
        "base": "buoyant",
        "soft": "buoyant",
        "bold": "buoyant"
      },
      "1+3": {
        "base": "optimistic",
        "soft": "optimistic",
        "bold": "enthusiastic"
      },
      "1+4": {
        "base": "gleeful",
        "soft": "gleeful",
        "bold": "gleeful"
      },
      "2+3": {
        "base": "refreshed",
        "soft": "refreshed",
        "bold": "invigorated"
      },
      "2+4": {
        "base": "curious",
        "soft": "curious",
        "bold": "inspired"
      },
      "3+4": {
        "base": "receptive",
        "soft": "receptive",
        "bold": "enthusiastic"
      },
      "0+1+2": {
        "base": "radiant",
        "soft": "pleased",
        "bold": "radiant"
      },
      "0+1+3": {
        "base": "jubilant",
        "soft": "cheerful",
        "bold": "jubilant"
      },
      "0+1+4": {
        "base": "effervescent",
        "soft": "playful",
        "bold": "effervescent"
      },
      "0+2+3": {
        "base": "renewed",
        "soft": "renewed",
        "bold": "renewed"
      },
      "0+2+4": {
        "base": "delighted",
        "soft": "delighted",
        "bold": "delighted"
      },
      "0+3+4": {
        "base": "enthusiastic",
        "soft": "enthusiastic",
        "bold": "enthusiastic"
      },
      "1+2+3": {
        "base": "invigorated",
        "soft": "refreshed",
        "bold": "invigorated"
      },
      "1+2+4": {
        "base": "radiant",
        "soft": "pleased",
        "bold": "radiant"
      },
      "1+3+4": {
        "base": "optimistic",
        "soft": "optimistic",
        "bold": "enthusiastic"
      },
      "2+3+4": {
        "base": "joyful",
        "soft": "joyful",
        "bold": "joyful"
      }
    }
  },
  {
    "id": "sadness",
    "name": "슬픈",
    "en": "Sad",
    "word": "sad",
    "background": {
      "id": "sadness",
      "color": "#101d38",
      "name": "깊은 네이비",
      "en": "Deep navy",
      "dark": true
    },
    "palettes": [
      {
        "id": "sadness.red",
        "color": "sky-blue",
        "tag": "longing",
        "name": "차가운 하늘색",
        "en": "Cold sky blue",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#3b6386",
              "#5887ac",
              "#8cb9d8",
              "#c3e8f5"
            ],
            "word": "longing"
          },
          {
            "id": "soft",
            "colors": [
              "#8f7380",
              "#674254",
              "#53677d",
              "#556d79"
            ],
            "word": "vulnerable"
          },
          {
            "id": "bold",
            "colors": [
              "#866273",
              "#5e3248",
              "#425975",
              "#251126"
            ],
            "word": "anguished"
          }
        ]
      },
      {
        "id": "sadness.yellow",
        "color": "pink-ivory",
        "tag": "regretful",
        "name": "분홍 · 아이보리 핵",
        "en": "Pink · ivory core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#de75a8",
              "#ba4e8c",
              "#e8bcb7",
              "#fff1d8"
            ],
            "word": "regretful"
          },
          {
            "id": "soft",
            "colors": [
              "#dd93b5",
              "#bd739d",
              "#e9cac3",
              "#fff5e5"
            ],
            "word": "nostalgic"
          },
          {
            "id": "bold",
            "colors": [
              "#dd5299",
              "#b62d7b",
              "#e9a7a9",
              "#ffedca"
            ],
            "word": "heavy-hearted"
          }
        ]
      },
      {
        "id": "sadness.blue",
        "color": "deep-green-red",
        "tag": "heartbroken",
        "name": "딥그린 · 선명한 빨강 핵",
        "en": "Deep green · vivid red core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#075d46",
              "#064534",
              "#bd202e",
              "#ff253b"
            ],
            "word": "heartbroken"
          },
          {
            "id": "soft",
            "colors": [
              "#24765d",
              "#1a5846",
              "#b7444b",
              "#f15d68"
            ],
            "word": "lonely"
          },
          {
            "id": "bold",
            "colors": [
              "#006b48",
              "#004b35",
              "#d40824",
              "#ff1434"
            ],
            "word": "forlorn"
          }
        ]
      },
      {
        "id": "sadness.green",
        "color": "black-gray",
        "tag": "resigned",
        "name": "검정 · 회색 핵",
        "en": "Black · gray core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#080808",
              "#202020",
              "#646464",
              "#b8b8b8"
            ],
            "word": "resigned"
          },
          {
            "id": "soft",
            "colors": [
              "#8c9499",
              "#707b84",
              "#424b56",
              "#171d25"
            ],
            "word": "forlorn"
          },
          {
            "id": "bold",
            "colors": [
              "#737e87",
              "#53616c",
              "#25313d",
              "#03070c"
            ],
            "word": "bereft"
          }
        ]
      },
      {
        "id": "sadness.purple",
        "color": "orange-red-white",
        "tag": "nostalgic",
        "name": "주황 · 은은한 빨강 · 흰 핵",
        "en": "Orange · subtle red · white core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#df792c",
              "#c9642a",
              "#cf6658",
              "#ffffff"
            ],
            "word": "nostalgic"
          },
          {
            "id": "soft",
            "colors": [
              "#dfa06a",
              "#c8895b",
              "#d89084",
              "#fffaf6"
            ],
            "word": "homesick"
          },
          {
            "id": "bold",
            "colors": [
              "#e56e15",
              "#c95118",
              "#d85749",
              "#ffffff"
            ],
            "word": "aching"
          }
        ]
      }
    ],
    "combinations": {
      "0": {
        "base": "aching",
        "soft": "nostalgic",
        "bold": "aching"
      },
      "1": {
        "base": "forlorn",
        "soft": "regretful",
        "bold": "forlorn"
      },
      "2": {
        "base": "forlorn",
        "soft": "heartbroken",
        "bold": "forlorn"
      },
      "3": {
        "base": "forlorn",
        "soft": "resigned",
        "bold": "forlorn"
      },
      "4": {
        "base": "homesick",
        "soft": "nostalgic",
        "bold": "aching"
      },
      "0+1": {
        "base": "longing",
        "soft": "poignant",
        "bold": "anguished"
      },
      "0+2": {
        "base": "bereft",
        "soft": "forlorn",
        "bold": "bereft"
      },
      "0+3": {
        "base": "forlorn",
        "soft": "longing",
        "bold": "forlorn"
      },
      "0+4": {
        "base": "homesick",
        "soft": "longing",
        "bold": "aching"
      },
      "1+2": {
        "base": "heavy-hearted",
        "soft": "heartbroken",
        "bold": "heavy-hearted"
      },
      "1+3": {
        "base": "bereft",
        "soft": "forlorn",
        "bold": "forlorn"
      },
      "1+4": {
        "base": "homesick",
        "soft": "sentimental",
        "bold": "aching"
      },
      "2+3": {
        "base": "desolate",
        "soft": "lonely",
        "bold": "desolate"
      },
      "2+4": {
        "base": "longing",
        "soft": "nostalgic",
        "bold": "longing"
      },
      "3+4": {
        "base": "homesick",
        "soft": "forlorn",
        "bold": "aching"
      },
      "0+1+2": {
        "base": "heavy-hearted",
        "soft": "heartbroken",
        "bold": "heavy-hearted"
      },
      "0+1+3": {
        "base": "forlorn",
        "soft": "poignant",
        "bold": "forlorn"
      },
      "0+1+4": {
        "base": "homesick",
        "soft": "longing",
        "bold": "aching"
      },
      "0+2+3": {
        "base": "bereft",
        "soft": "forlorn",
        "bold": "bereft"
      },
      "0+2+4": {
        "base": "longing",
        "soft": "longing",
        "bold": "anguished"
      },
      "0+3+4": {
        "base": "forlorn",
        "soft": "aching",
        "bold": "forlorn"
      },
      "1+2+3": {
        "base": "aching",
        "soft": "aching",
        "bold": "desperate"
      },
      "1+2+4": {
        "base": "heavy-hearted",
        "soft": "heartbroken",
        "bold": "heavy-hearted"
      },
      "1+3+4": {
        "base": "homesick",
        "soft": "regretful",
        "bold": "aching"
      },
      "2+3+4": {
        "base": "forlorn",
        "soft": "sad",
        "bold": "forlorn"
      }
    }
  },
  {
    "id": "anger",
    "name": "화가 난",
    "en": "Angry",
    "word": "angry",
    "background": {
      "id": "anger",
      "color": "#171b46",
      "name": "딥 인디고",
      "en": "Deep indigo",
      "dark": true
    },
    "palettes": [
      {
        "id": "anger.red",
        "color": "red-orange",
        "tag": "angry",
        "name": "빨강 · 주황 핵",
        "en": "Red · orange core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#ff7908",
              "#ed3b0c",
              "#c31b12",
              "#ff8600"
            ],
            "word": "angry"
          },
          {
            "id": "soft",
            "colors": [
              "#ed8123",
              "#d84e1a",
              "#ac2b17",
              "#ee9129"
            ],
            "word": "frustrated"
          },
          {
            "id": "bold",
            "colors": [
              "#ff8500",
              "#ff3908",
              "#de1112",
              "#ff9200"
            ],
            "word": "furious"
          }
        ]
      },
      {
        "id": "anger.yellow",
        "color": "blue-deep-red",
        "tag": "indignant",
        "name": "딥블루 · 깊은 빨강 핵",
        "en": "Deep blue · deep red core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#183fc9",
              "#13338f",
              "#dc1531",
              "#650414"
            ],
            "word": "indignant"
          },
          {
            "id": "soft",
            "colors": [
              "#2e4ca9",
              "#26417d",
              "#be2940",
              "#711323"
            ],
            "word": "angry"
          },
          {
            "id": "bold",
            "colors": [
              "#1745ed",
              "#102fa9",
              "#ff0c32",
              "#59000f"
            ],
            "word": "agitated"
          }
        ]
      },
      {
        "id": "anger.blue",
        "color": "blue",
        "tag": "frustrated",
        "name": "파랑 · 푸른 핵",
        "en": "Blue · blue core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#1988ef",
              "#1762d8",
              "#1649b8",
              "#2168ff"
            ],
            "word": "frustrated"
          },
          {
            "id": "soft",
            "colors": [
              "#328dd8",
              "#2868bd",
              "#24509f",
              "#3972df"
            ],
            "word": "resentful"
          },
          {
            "id": "bold",
            "colors": [
              "#078cff",
              "#075fe9",
              "#0c40cb",
              "#1263ff"
            ],
            "word": "charged"
          }
        ]
      },
      {
        "id": "anger.green",
        "color": "pink-green",
        "tag": "confused",
        "name": "분홍 · 초록 핵",
        "en": "Pink · green core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#ec3a9b",
              "#c9247e",
              "#1f914e",
              "#59df72"
            ],
            "word": "confused"
          },
          {
            "id": "soft",
            "colors": [
              "#d9509a",
              "#b13f7b",
              "#3c8f61",
              "#6fc381"
            ],
            "word": "torn"
          },
          {
            "id": "bold",
            "colors": [
              "#ff1a9a",
              "#dc0078",
              "#009b40",
              "#43f567"
            ],
            "word": "turbulent"
          }
        ]
      },
      {
        "id": "anger.purple",
        "color": "purple",
        "tag": "resentful",
        "name": "초록 · 보라",
        "en": "Green · purple",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#37ca42",
              "#1ba137",
              "#7e23cd",
              "#480b79"
            ],
            "word": "resentful"
          },
          {
            "id": "soft",
            "colors": [
              "#4ab54e",
              "#319242",
              "#7536b2",
              "#4b206e"
            ],
            "word": "bitter"
          },
          {
            "id": "bold",
            "colors": [
              "#27e735",
              "#08b92d",
              "#8e0ceb",
              "#50008c"
            ],
            "word": "seething"
          }
        ]
      }
    ],
    "combinations": {
      "0": {
        "base": "angry",
        "soft": "frustrated",
        "bold": "furious"
      },
      "1": {
        "base": "indignant",
        "soft": "angry",
        "bold": "agitated"
      },
      "2": {
        "base": "frustrated",
        "soft": "resentful",
        "bold": "charged"
      },
      "3": {
        "base": "confused",
        "soft": "torn",
        "bold": "turbulent"
      },
      "4": {
        "base": "resentful",
        "soft": "bitter",
        "bold": "seething"
      },
      "0+1": {
        "base": "furious",
        "soft": "frustrated",
        "bold": "furious"
      },
      "0+2": {
        "base": "charged",
        "soft": "conflicted",
        "bold": "charged"
      },
      "0+3": {
        "base": "turbulent",
        "soft": "torn",
        "bold": "turbulent"
      },
      "0+4": {
        "base": "seething",
        "soft": "resentful",
        "bold": "seething"
      },
      "1+2": {
        "base": "seething",
        "soft": "resentful",
        "bold": "angry"
      },
      "1+3": {
        "base": "torn",
        "soft": "torn",
        "bold": "turbulent"
      },
      "1+4": {
        "base": "resentful",
        "soft": "angry",
        "bold": "seething"
      },
      "2+3": {
        "base": "torn",
        "soft": "conflicted",
        "bold": "charged"
      },
      "2+4": {
        "base": "resentful",
        "soft": "frustrated",
        "bold": "furious"
      },
      "3+4": {
        "base": "torn",
        "soft": "resentful",
        "bold": "turbulent"
      },
      "0+1+2": {
        "base": "seething",
        "soft": "resentful",
        "bold": "seething"
      },
      "0+1+3": {
        "base": "turbulent",
        "soft": "torn",
        "bold": "turbulent"
      },
      "0+1+4": {
        "base": "furious",
        "soft": "frustrated",
        "bold": "furious"
      },
      "0+2+3": {
        "base": "torn",
        "soft": "torn",
        "bold": "turbulent"
      },
      "0+2+4": {
        "base": "seething",
        "soft": "resentful",
        "bold": "seething"
      },
      "0+3+4": {
        "base": "resentful",
        "soft": "turbulent",
        "bold": "furious"
      },
      "1+2+3": {
        "base": "charged",
        "soft": "conflicted",
        "bold": "charged"
      },
      "1+2+4": {
        "base": "furious",
        "soft": "frustrated",
        "bold": "furious"
      },
      "1+3+4": {
        "base": "torn",
        "soft": "indignant",
        "bold": "charged"
      },
      "2+3+4": {
        "base": "resentful",
        "soft": "frustrated",
        "bold": "seething"
      }
    },
    "coreGlow": true
  },
  {
    "id": "fear",
    "name": "두려운",
    "en": "Afraid",
    "word": "afraid",
    "background": {
      "id": "fear",
      "color": "#210c32",
      "name": "어두운 플럼",
      "en": "Deep plum",
      "dark": true
    },
    "palettes": [
      {
        "id": "fear.red",
        "color": "red",
        "tag": "threatened",
        "name": "빨강",
        "en": "Red",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#ba6b7c",
              "#900c3f",
              "#5a0f11",
              "#76ba1b"
            ],
            "word": "afraid"
          },
          {
            "id": "soft",
            "colors": [
              "#b77a88",
              "#8f1a47",
              "#5d181a",
              "#2c3539"
            ],
            "word": "vulnerable"
          },
          {
            "id": "bold",
            "colors": [
              "#bc5c71",
              "#8d0338",
              "#54090b",
              "#b1ad2a"
            ],
            "word": "threatened"
          }
        ]
      },
      {
        "id": "fear.yellow",
        "color": "yellow",
        "tag": "alarmed",
        "name": "노랑",
        "en": "Yellow",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#d4a373",
              "#c5af32",
              "#4a3b32",
              "#3d155f"
            ],
            "word": "alarmed"
          },
          {
            "id": "soft",
            "colors": [
              "#cfa985",
              "#bfad45",
              "#4f423a",
              "#3a4750"
            ],
            "word": "apprehensive"
          },
          {
            "id": "bold",
            "colors": [
              "#d89d62",
              "#c5ad26",
              "#44352b",
              "#6c1649"
            ],
            "word": "panicked"
          }
        ]
      },
      {
        "id": "fear.blue",
        "color": "blue",
        "tag": "watchful",
        "name": "파랑",
        "en": "Blue",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#647b98",
              "#3a4750",
              "#233146",
              "#bc8e28"
            ],
            "word": "watchful"
          },
          {
            "id": "soft",
            "colors": [
              "#708299",
              "#424d55",
              "#2b384b",
              "#796b50"
            ],
            "word": "guarded"
          },
          {
            "id": "bold",
            "colors": [
              "#5b7494",
              "#33414a",
              "#1d2b40",
              "#a69427"
            ],
            "word": "on edge"
          }
        ]
      },
      {
        "id": "fear.green",
        "color": "viridian-steel-blue",
        "tag": "defensive",
        "name": "비리디언 · 메탈릭 블루 핵",
        "en": "Viridian · metallic blue core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#178a74",
              "#0e625d",
              "#2b5b79",
              "#4c91ba"
            ],
            "word": "defensive"
          },
          {
            "id": "soft",
            "colors": [
              "#3b8e7f",
              "#2b6b66",
              "#3f6b85",
              "#669ebd"
            ],
            "word": "uncertain"
          },
          {
            "id": "bold",
            "colors": [
              "#008a6e",
              "#005b58",
              "#1a567d",
              "#338fc5"
            ],
            "word": "disquieted"
          }
        ]
      },
      {
        "id": "fear.purple",
        "color": "violet-pink",
        "tag": "anxious",
        "name": "바이올렛 · 분홍 핵",
        "en": "Violet · pink core",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#7a2bc0",
              "#54208e",
              "#ba3a92",
              "#f276c3"
            ],
            "word": "anxious"
          },
          {
            "id": "soft",
            "colors": [
              "#8753b5",
              "#654289",
              "#b45e99",
              "#e79acb"
            ],
            "word": "tentative"
          },
          {
            "id": "bold",
            "colors": [
              "#8116df",
              "#5305a4",
              "#d61da3",
              "#ff64d0"
            ],
            "word": "troubled"
          }
        ]
      }
    ],
    "combinations": {
      "0": {
        "base": "threatened",
        "soft": "vulnerable",
        "bold": "threatened"
      },
      "1": {
        "base": "on edge",
        "soft": "watchful",
        "bold": "on edge"
      },
      "2": {
        "base": "guarded",
        "soft": "watchful",
        "bold": "watchful"
      },
      "3": {
        "base": "apprehensive",
        "soft": "defensive",
        "bold": "apprehensive"
      },
      "4": {
        "base": "uncertain",
        "soft": "anxious",
        "bold": "troubled"
      },
      "0+1": {
        "base": "panicked",
        "soft": "afraid",
        "bold": "panicked"
      },
      "0+2": {
        "base": "threatened",
        "soft": "vulnerable",
        "bold": "threatened"
      },
      "0+3": {
        "base": "apprehensive",
        "soft": "afraid",
        "bold": "apprehensive"
      },
      "0+4": {
        "base": "afraid",
        "soft": "defensive",
        "bold": "afraid"
      },
      "1+2": {
        "base": "on edge",
        "soft": "watchful",
        "bold": "on edge"
      },
      "1+3": {
        "base": "alarmed",
        "soft": "apprehensive",
        "bold": "alarmed"
      },
      "1+4": {
        "base": "disquieted",
        "soft": "uncertain",
        "bold": "disquieted"
      },
      "2+3": {
        "base": "apprehensive",
        "soft": "guarded",
        "bold": "apprehensive"
      },
      "2+4": {
        "base": "uncertain",
        "soft": "tentative",
        "bold": "troubled"
      },
      "3+4": {
        "base": "troubled",
        "soft": "anxious",
        "bold": "troubled"
      },
      "0+1+2": {
        "base": "threatened",
        "soft": "vulnerable",
        "bold": "threatened"
      },
      "0+1+3": {
        "base": "alarmed",
        "soft": "apprehensive",
        "bold": "alarmed"
      },
      "0+1+4": {
        "base": "panicked",
        "soft": "afraid",
        "bold": "panicked"
      },
      "0+2+3": {
        "base": "afraid",
        "soft": "defensive",
        "bold": "afraid"
      },
      "0+2+4": {
        "base": "threatened",
        "soft": "vulnerable",
        "bold": "threatened"
      },
      "0+3+4": {
        "base": "afraid",
        "soft": "defensive",
        "bold": "afraid"
      },
      "1+2+3": {
        "base": "restless",
        "soft": "apprehensive",
        "bold": "restless"
      },
      "1+2+4": {
        "base": "on edge",
        "soft": "watchful",
        "bold": "on edge"
      },
      "1+3+4": {
        "base": "disquieted",
        "soft": "uncertain",
        "bold": "disquieted"
      },
      "2+3+4": {
        "base": "apprehensive",
        "soft": "anxious",
        "bold": "apprehensive"
      }
    }
  },
  {
    "id": "peace",
    "name": "평온한",
    "en": "Peaceful",
    "word": "serene",
    "background": {
      "id": "peace",
      "color": "#dce3df",
      "name": "옅은 세이지",
      "en": "Pale sage",
      "dark": false
    },
    "palettes": [
      {
        "id": "peace.red",
        "color": "red",
        "tag": "warm",
        "name": "빨강",
        "en": "Red",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#d0a2a2",
              "#deb1b1",
              "#ebcbcb",
              "#f4e8e8"
            ],
            "word": "warm"
          },
          {
            "id": "soft",
            "colors": [
              "#d6baba",
              "#e1caca",
              "#eadcdc",
              "#f6eeee"
            ],
            "word": "tender"
          },
          {
            "id": "bold",
            "colors": [
              "#c19090",
              "#d2a1a1",
              "#e1c0c0",
              "#f0dede"
            ],
            "word": "cherished"
          }
        ]
      },
      {
        "id": "peace.yellow",
        "color": "yellow",
        "tag": "mellow",
        "name": "노랑",
        "en": "Yellow",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#e8e2b2",
              "#efe9be",
              "#f6f1d5",
              "#fbf9e8"
            ],
            "word": "mellow"
          },
          {
            "id": "soft",
            "colors": [
              "#ccc3ae",
              "#dcd3bf",
              "#eae4d4",
              "#f5f2e8"
            ],
            "word": "unhurried"
          },
          {
            "id": "bold",
            "colors": [
              "#b4a27e",
              "#c6b38c",
              "#daccb0",
              "#ede4d2"
            ],
            "word": "pleased"
          }
        ]
      },
      {
        "id": "peace.blue",
        "color": "blue",
        "tag": "clear",
        "name": "파랑",
        "en": "Blue",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#9bafce",
              "#a6c3e8",
              "#c4d8f2",
              "#ebf2fa"
            ],
            "word": "clear"
          },
          {
            "id": "soft",
            "colors": [
              "#b2bfd3",
              "#c0d2e7",
              "#d8e4f2",
              "#f1f5fa"
            ],
            "word": "attentive"
          },
          {
            "id": "bold",
            "colors": [
              "#8ba4c6",
              "#9cb9df",
              "#bacfeb",
              "#e1ecf8"
            ],
            "word": "lucid"
          }
        ]
      },
      {
        "id": "peace.green",
        "color": "green",
        "tag": "fresh",
        "name": "초록",
        "en": "Green",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#879e82",
              "#a7c1a0",
              "#d3e4ca",
              "#edf4e7"
            ],
            "word": "fresh"
          },
          {
            "id": "soft",
            "colors": [
              "#a3b39e",
              "#bed0b7",
              "#dbe8d5",
              "#f2f6ee"
            ],
            "word": "hopeful"
          },
          {
            "id": "bold",
            "colors": [
              "#7d9777",
              "#9eb897",
              "#c3d9ba",
              "#e5f0dd"
            ],
            "word": "renewed"
          }
        ]
      },
      {
        "id": "peace.purple",
        "color": "purple",
        "tag": "still",
        "name": "보라",
        "en": "Purple",
        "variants": [
          {
            "id": "base",
            "colors": [
              "#b4a1c8",
              "#c3b0db",
              "#ddd0eb",
              "#f0eaf7"
            ],
            "word": "tranquil"
          },
          {
            "id": "soft",
            "colors": [
              "#c2b7cd",
              "#d2c8dd",
              "#e5deeb",
              "#f5f1f8"
            ],
            "word": "hushed"
          },
          {
            "id": "bold",
            "colors": [
              "#a491b9",
              "#b6a2ce",
              "#d2c2e3",
              "#eae1f4"
            ],
            "word": "meditative"
          }
        ]
      }
    ],
    "combinations": {
      "0": {
        "base": "warm",
        "soft": "warm",
        "bold": "cherished"
      },
      "1": {
        "base": "mellow",
        "soft": "mellow",
        "bold": "pleased"
      },
      "2": {
        "base": "clear",
        "soft": "clear",
        "bold": "lucid"
      },
      "3": {
        "base": "fresh",
        "soft": "fresh",
        "bold": "renewed"
      },
      "4": {
        "base": "tranquil",
        "soft": "tranquil",
        "bold": "meditative"
      },
      "0+1": {
        "base": "pleased",
        "soft": "pleased",
        "bold": "pleased"
      },
      "0+2": {
        "base": "harmonious",
        "soft": "reassured",
        "bold": "composed"
      },
      "0+3": {
        "base": "replenished",
        "soft": "replenished",
        "bold": "replenished"
      },
      "0+4": {
        "base": "gentle",
        "soft": "gentle",
        "bold": "attentive"
      },
      "1+2": {
        "base": "lucid",
        "soft": "attentive",
        "bold": "lucid"
      },
      "1+3": {
        "base": "renewed",
        "soft": "hopeful",
        "bold": "renewed"
      },
      "1+4": {
        "base": "unhurried",
        "soft": "unhurried",
        "bold": "unhurried"
      },
      "2+3": {
        "base": "refreshed",
        "soft": "refreshed",
        "bold": "refreshed"
      },
      "2+4": {
        "base": "balanced",
        "soft": "balanced",
        "bold": "balanced"
      },
      "3+4": {
        "base": "attentive",
        "soft": "attentive",
        "bold": "attentive"
      },
      "0+1+2": {
        "base": "whole",
        "soft": "settled",
        "bold": "whole"
      },
      "0+1+3": {
        "base": "restored",
        "soft": "replenished",
        "bold": "restored"
      },
      "0+1+4": {
        "base": "cherished",
        "soft": "cherished",
        "bold": "cherished"
      },
      "0+2+3": {
        "base": "restored",
        "soft": "replenished",
        "bold": "restored"
      },
      "0+2+4": {
        "base": "serene",
        "soft": "gentle",
        "bold": "serene"
      },
      "0+3+4": {
        "base": "grateful",
        "soft": "grateful",
        "bold": "grateful"
      },
      "1+2+3": {
        "base": "renewed",
        "soft": "hopeful",
        "bold": "renewed"
      },
      "1+2+4": {
        "base": "untroubled",
        "soft": "untroubled",
        "bold": "untroubled"
      },
      "1+3+4": {
        "base": "restored",
        "soft": "replenished",
        "bold": "restored"
      },
      "2+3+4": {
        "base": "serene",
        "soft": "gentle",
        "bold": "serene"
      }
    }
  }
];
const EXTRA_KO={desperate:'절망적인',sad:'슬픈',angry:'화가 난',afraid:'두려운',irritated:'짜증나는',frustrated:'답답한',resentful:'억울한',bitter:'씁쓸한',indignant:'불공평한',seething:'속이 끓는',furious:'몹시 화가 난',threatened:'위협받는',alarmed:'깜짝 놀라 긴장한',panicked:'겁에 질린',confused:'혼란스러운',defensive:'방어적인',anxious:'불안한'};
const ROLE_WORDS={warmPair:{base:'cherished',soft:'embraced',bold:'trusting'},greenTrio:{base:'refreshed',soft:'hopeful',bold:'renewed'}};
const SOOTHING=new Set(['serene','calm','peaceful','comforted','soothed','safe','reassured','reassuring','tranquil','placid','at ease','relaxed','unhurried','hushed','held','gentle','mellow','meditative','contemplative','introspective']);
// User-approved controls are part of each authored palette's starting point.
const DEFAULT_ADJUSTMENTS={
 joy:{hue:0,sat:1.26,light:-.16,contrast:1},
 sadness:{hue:0,sat:1.20,light:-.10,contrast:.78},
 anger:{hue:-38,sat:1,light:-.21,contrast:.70},
 fear:{hue:-40,sat:1,light:0,contrast:1},
 peace:{hue:0,sat:1,light:-.10,contrast:1}
};
function defaultsFor(mood){return {...DEFAULT_ADJUSTMENTS[mood]};}
function recipe(mood,index){return MOODS.find(m=>m.id===mood)?.palettes[index]||null;}
function resolve({mood,orbs,background,adjustments={}}){
 const fail=(status,reason,extra={})=>({status,reason,word:null,mood,...extra});
 const m=MOODS.find(m=>m.id===mood);
 if(!m||background!==m.background.id||!Array.isArray(orbs))return fail('unmapped','unmapped');
 if(!orbs.length)return fail('empty','empty');
 if(orbs.some(o=>o.transitioning))return fail('transitioning','transitioning');
 const ids=orbs.map(o=>m.palettes.findIndex(p=>p.id===o.paletteId)).sort((a,b)=>a-b);
 if(ids.some(i=>i<0)||new Set(ids).size!==ids.length||ids.length>3)return fail('unmapped','unmapped');
 const signature=ids.join('+'),entry=m.combinations[signature];
 if(!entry||orbs.some(o=>!['base','soft','bold'].includes(o.variant)))return fail('unmapped','unmapped');
 const internal=Math.max(...orbs.map(o=>o.internalContrast)),backdrop=Math.max(...orbs.map(o=>o.backgroundContrast)),chroma=Math.max(...orbs.map(o=>o.chroma)),light=Math.max(...orbs.map(o=>o.light));
 let hueGap=0,lightGap=0;
 for(let i=0;i<orbs.length;i++)for(let j=i+1;j<orbs.length;j++){
  const a=orbs[i],b=orbs[j],d=Math.abs(a.hue-b.hue);
  if(Math.min(a.chroma,b.chroma)>.06)hueGap=Math.max(hueGap,Math.min(d,360-d)/180);
  lightGap=Math.max(lightGap,Math.abs(a.light-b.light));
 }
 const metrics={internal,backdrop,chroma,hueGap,lightGap,light};
 if(Object.values(metrics).some(n=>!Number.isFinite(n)))return fail('unmapped','unmapped');
 // Separate compatibility gates. Contrast is never a psychological score.
 const strong=internal>.50||(backdrop>.60&&chroma>.15)||(hueGap>.68&&lightGap>.24&&chroma>.14);
 const authored=defaultsFor(mood),actual={...authored,...adjustments};
 const shift=Math.abs(actual.hue-authored.hue)>30||Math.abs(actual.light-authored.light)>.20||actual.sat<.15;
 if(shift)return fail('mismatch','palette-shift',{signature,metrics});
 if(mood==='peace'&&(strong||chroma>.18))return fail('mismatch','contrast',{signature,metrics});
 if(['fear','anger'].includes(mood)&&orbs.every(o=>o.light>.84&&o.internalContrast<.12))return fail('mismatch','washed-out',{signature,metrics});
 // A bold accent has a different role from a softened accent. This priority is
 // editorial; there are no numeric word weights and no random word selection.
 const profile=strong||orbs.some(o=>o.variant==='bold')?'bold':orbs.some(o=>o.variant==='soft')?'soft':'base';
 let word=entry[profile];
 // Sadness, anger and fear singles are authored emotion identities. Their
 // selected core/exterior palette keeps its specific name at strong contrast.
 // The compatibility gates above and the soothing-word veto below still apply.
 if(orbs.length===1){const p=m.palettes[ids[0]],variant=strong&&!['sadness','anger','fear'].includes(mood)?'bold':orbs[0].variant;word=p.variants.find(v=>v.id===variant).word;}
 const ranked=[...orbs].sort((a,b)=>b.area-a.area||a.paletteId.localeCompare(b.paletteId));
 const role=ranked.length>1&&ranked[0].area>=ranked[1].area*1.5?ranked[0].paletteId:'balanced';
 if(mood==='peace'&&signature==='0+2'&&role==='peace.red')word=ROLE_WORDS.warmPair[profile];
 if(mood==='peace'&&signature==='0+2+3'&&role==='peace.green')word=ROLE_WORDS.greenTrio[profile];
 if(strong&&SOOTHING.has(word))return fail('mismatch','contrast',{signature,metrics});
 return {status:'matched',word,mood,signature,profile,strength:strong?'strong':'normal',role,metrics};
}
const api={MOODS,EXTRA_KO,ROLE_WORDS,SOOTHING,defaultsFor,recipe,resolve};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MindfulMood=api;
})(typeof window==='object'?window:this);

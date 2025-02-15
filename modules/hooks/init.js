import NameGenWfrp from "../apps/name-gen.js";
import TravelDistanceWfrp4e from "../apps/travel-distance-wfrp4e.js";
import HomebrewSettings from "../apps/homebrew-settings.js";

export default function() {
  /**
   * Init function loads tables, registers settings, and loads templates
   */
  Hooks.once("init", () => {

    if (isNewerVersion(game.data.version, "0.7.10")) {
      Game.prototype.setupGame = function () {
        alert("WFRP4E IS NOT COMPATIBLE WITH FOUNDRY 0.8.6 YET. Please rollback your Foundry version to 0.7.10 until a compatible version is released.")
        throw new Error("WFRP4E IS NOT COMPATIBLE WITH FOUNDRY 0.8.6 YET. Please rollback your Foundry version to 0.7.10 until a compatible version is released.");
      }
    }

    TravelDistanceWfrp4e.loadTravelData();

    // load tables from system folder
    FilePicker.browse("data", "systems/wfrp4e/tables").then(resp => {
      try {
        if (resp.error)
          throw ""
        for (var file of resp.files) {
          try {
            if (!file.includes(".json"))
              continue
            let filename = file.substring(file.lastIndexOf("/") + 1, file.indexOf(".json"));
            fetch(file).then(r => r.json()).then(async records => {
              game.wfrp4e.tables[filename] = records;
            })
          }
          catch (error) {
            console.error("Error reading " + file + ": " + error)
          }
        }
      }
      catch
      {
        // Do nothing
      }
    })
    // Create scatter table
    game.wfrp4e.tables.scatter = {
      name: "Scatter",
      die: "1d10",
      rows: [
        {
          name: "Top Left",
          range: [1, 1]
        },
        {
          name: "Top Middle",
          range: [2, 2]
        },
        {
          name: "Top Right",
          range: [3, 3]
        },
        {
          name: "Center Left",
          range: [4, 4]
        },
        {
          name: "Center Right",
          range: [5, 5]
        },
        {
          name: "Bottom Left",
          range: [6, 6]
        },
        {
          name: "Bottom Middle",
          range: [7, 7]
        },
        {
          name: "Bottom Right",
          range: [8, 8]
        },
        {
          name: "At your feet",
          range: [9, 9]
        },
        {
          name: "At the target's feet",
          range: [10, 10]
        },
      ]
    }

    // Create Winds table
    game.wfrp4e.tables.winds = {
      name: "The Swirling Winds",
      die: "1d10",
      rows: [
        {
          modifier: "-30",
          range: [1, 1]
        },
        {
          modifier: "-10",
          range: [2, 3]
        },
        {
          modifier: "0",
          range: [4, 7]
        },
        {
          modifier: "+10",
          range: [8, 9]
        },
        {
          modifier: "+30",
          range: [10, 10]
        }
      ]
    }


    game.settings.register("wfrp4e", "systemMigrationVersion", {
      name: "System Migration Version",
      scope: "world",
      config: false,
      type: String,
      default: 0
    });

    game.settings.registerMenu("wfrp4e", "homebrew", {
      name: "WFRP4e House Rules",
      label: "WFRP4e Homebrew",
      hint: "Settings for common homebrew/house rules",
      type: HomebrewSettings,
      restricted: true
  })

    // Register initiative rule
    game.settings.register("wfrp4e", "initiativeRule", {
      name: "SETTINGS.InitRule",
      hint: "SETTINGS.InitHint",
      scope: "world",
      config: true,
      default: "default",
      type: String,
      choices: {
        "default": "SETTINGS.InitDefault",
        "sl": "SETTINGS.InitSL",
        "d10Init": "SETTINGS.InitD10",
        "d10InitAgi": "SETTINGS.InitD10Agi"
      },
      onChange: rule => _setWfrp4eInitiative(rule)
    });
    _setWfrp4eInitiative(game.settings.get("wfrp4e", "initiativeRule"));


    function _setWfrp4eInitiative(initMethod) {
      let formula;
      switch (initMethod) {
        case "default":
          formula = "@characteristics.i.value + @characteristics.ag.value/100";
          break;

        case "sl":
          formula = "(floor(@characteristics.i.value / 10) - floor(1d100/10))"
          break;

        case "d10Init":
          formula = "1d10 + @characteristics.i.value"
          break;

        case "d10InitAgi":
          formula = "1d10 + @characteristics.i.bonus + @characteristics.ag.bonus"
          break;
      }

      let decimals = (initMethod == "default") ? 2 : 0;
      CONFIG.Combat.initiative = {
        formula: formula,
        decimals: decimals
      }
    }


    // Register Advantage cap
    game.settings.register("wfrp4e", "capAdvantageIB", {
      name: "SETTINGS.CapAdvIB",
      hint: "SETTINGS.CapAdvIBHint",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });

    // Register Fast SL rule
    game.settings.register("wfrp4e", "fastSL", {
      name: "SETTINGS.FastSL",
      hint: "SETTINGS.FastSLHint",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });

    // Register Tests above 100% Rule
    game.settings.register("wfrp4e", "testAbove100", {
      name: "SETTINGS.TestsAbove100",
      hint: "SETTINGS.TestsAbove100Hint",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });

    // Register Criticals/Fumbles on all tests
    game.settings.register("wfrp4e", "criticalsFumblesOnAllTests", {
      name: "SETTINGS.CriticalsFumblesAllTests",
      hint: "SETTINGS.CriticalsFumblesAllTestsHint",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });


    // Register Extended Tests
    game.settings.register("wfrp4e", "extendedTests", {
      name: "SETTINGS.ExtendedTests",
      hint: "SETTINGS.ExtendedTestsHint",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });

    
    // Register Partial Channelling
    game.settings.register("wfrp4e", "partialChannelling", {
      name: "SETTINGS.PartialChannelling",
      hint: "SETTINGS.PartialChannellingHint",
      scope: "world",
      homebrew: true,
      config: false,
      default: false,
      type: Boolean
    });


    game.settings.register("wfrp4e", "channelingNegativeSLTests", {
      name: "SETTINGS.ChannelingNegativeSL",
      hint: "SETTINGS.ChannelingNegativeSLHint",
      scope: "world",
      config: false,
      homebrew: true,
      default: false,
      type: Boolean
    });

    // Limit Equipped Items
    game.settings.register("wfrp4e", "limitEquippedWeapons", {
      name: "SETTINGS.LimitEquippedWeapons",
      hint: "SETTINGS.LimitEquippedWeaponsHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });

    // Register Test auto-fill
    game.settings.register("wfrp4e", "autoFillAdvantage", {
      name: "SETTINGS.AutoFillAdv",
      hint: "SETTINGS.AutoFillAdvHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });

    // Register default test difficulty
    game.settings.register("wfrp4e", "testDefaultDifficulty", {
      name: "SETTINGS.TestDialogDefaultDifficulty",
      hint: "SETTINGS.TestDialogDefaultDifficultyHint",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });

    // Register Round Summary
    game.settings.register("wfrp4e", "displayRoundSummary", {
      name: "SETTINGS.RoundSummary",
      hint: "SETTINGS.RoundSummaryHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });

    // Register Status on Turn Start
    game.settings.register("wfrp4e", "statusOnTurnStart", {
      name: "SETTINGS.StatusTurnStart",
      hint: "SETTINGS.StatusTurnStartHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });


    // Register Focus on Turn Start
    game.settings.register("wfrp4e", "focusOnTurnStart", {
      name: "SETTINGS.FocusTurnStart",
      hint: "SETTINGS.FocusTurnStartHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });

    // Register Hiding Test Data
    game.settings.register("wfrp4e", "hideTestData", {
      name: "SETTINGS.HideTestData",
      hint: "SETTINGS.HideTestDataHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });

    // Register Manual Chat Cards
    game.settings.register("wfrp4e", "manualChatCards", {
      name: "SETTINGS.ManualChatCards",
      hint: "SETTINGS.ManualChatCardsHint",
      scope: "client",
      config: true,
      default: false,
      type: Boolean
    });

    game.settings.register("wfrp4e", "weaponLength", {
      name: "SETTINGS.WeaponLength",
      hint: "SETTINGS.WeaponLengthHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });

    game.settings.register("wfrp4e", "rangeAutoCalculation", {
      name: "SETTINGS.RangeAutoCalculation",
      hint: "SETTINGS.RangeAutoCalculationHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });


    game.settings.register("wfrp4e", "playerBrowser", {
      name: "SETTINGS.PlayerBrowser",
      hint: "SETTINGS.PlayerBrowserHint",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
    });

    game.settings.register("wfrp4e", "playerExperienceEditing", {
      name: "SETTINGS.PlayerExperienceEditing",
      hint: "SETTINGS.PlayerExperienceEditing",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });


    // Register Advantage cap
    game.settings.register("wfrp4e", "soundPath", {
      name: "SETTINGS.SoundEffects",
      hint: "SETTINGS.SoundEffectsHint",
      scope: "world",
      config: true,
      default: "systems/wfrp4e/sounds/",
      type: String
    });

    game.settings.register("wfrp4e", "customCursor", {
      name: "SETTINGS.CustomCursor",
      hint: "SETTINGS.CustomCursorHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });


    game.settings.register("wfrp4e", "throwMoney", {
      name: "SETTINGS.ThrowMoney",
      hint: "SETTINGS.ThrowMoneyHint",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
    });



    game.settings.register("wfrp4e", "dangerousCrits", {
      name: "SETTINGS.DangerousCrits",
      hint: "SETTINGS.DangerousCritsHint",
      scope: "world",
      config: false,
      homebrew: true,
      default: false,
      type: Boolean
    });

    game.settings.register("wfrp4e", "dangerousCritsMod", {
      name: "SETTINGS.DangerousCritsMod",
      hint: "SETTINGS.DangerousCritsModHint",
      scope: "world",
      config: false,
      homebrew: true,
      default: 10,
      type: Number
    });

    game.settings.register("wfrp4e", "tables", {
      scope: "world",
      config: false,
      default: {},
      type: Object
    });

    game.settings.register("wfrp4e", "bugReportName", {
      scope: "world",
      config: false,
      default: "",
      type: String
    });

    game.settings.register("wfrp4e", "tableVisibility", {
      scope: "world",
      config: false,
      default: {},
      type: Object
    });

    
    game.settings.register("wfrp4e", "tableRollMode", {
      scope: "client",
      config: false,
      default: {},
      type: Object
    });




    // Pre-load templates
    loadTemplates([
      "systems/wfrp4e/templates/actors/character/character-main.html",
      "systems/wfrp4e/templates/actors/actor-combat.html",
      "systems/wfrp4e/templates/actors/actor-effects.html",
      "systems/wfrp4e/templates/actors/actor-biography.html",
      "systems/wfrp4e/templates/actors/actor-inventory.html",
      "systems/wfrp4e/templates/actors/actor-skills.html",
      "systems/wfrp4e/templates/actors/actor-magic.html",
      "systems/wfrp4e/templates/actors/actor-religion.html",
      "systems/wfrp4e/templates/actors/actor-talents.html",
      "systems/wfrp4e/templates/actors/actor-notes.html",
      "systems/wfrp4e/templates/actors/npc/npc-careers.html",
      "systems/wfrp4e/templates/actors/creature/creature-main.html",
      "systems/wfrp4e/templates/actors/creature/creature-notes.html",
      "systems/wfrp4e/templates/actors/creature/creature-main.html",
      "systems/wfrp4e/templates/actors/vehicle/vehicle-main.html",
      "systems/wfrp4e/templates/actors/vehicle/vehicle-cargo.html",
      "systems/wfrp4e/templates/actors/vehicle/vehicle-description.html",
      "systems/wfrp4e/templates/actors/vehicle/vehicle-effects.html",
      "systems/wfrp4e/templates/dialog/dialog-constant.html",
      "systems/wfrp4e/templates/chat/roll/test-card.html",
      "systems/wfrp4e/templates/chat/help/chat-command-display-info.html",
      "systems/wfrp4e/templates/items/item-header.html",
      "systems/wfrp4e/templates/items/item-description.html",
      "systems/wfrp4e/templates/items/item-effects.html"
    ]);

    // Load name construction from files
    NameGenWfrp._loadNames();
    CONFIG.Morrslieb = new PIXI.filters.AdjustmentFilter({ green: 0.7137, red: 0.302, blue: 0.2275 })

    CONFIG.fontFamilies.push("CaslonAntique")
    FONTS["CaslonAntique"] = {
      custom: {
        families: ['CaslonAntique'],
        urls: ['systems/wfrp4e/fonts/CaslonAntique.ttf  ']
      }
    }

    CONFIG.canvasTextStyle = new PIXI.TextStyle({
      fontFamily: "CaslonAntique",
      fontSize: 36,
      fill: "#FFFFFF",
      stroke: '#111111',
      strokeThickness: 1,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: 0,
      dropShadowDistance: 0,
      align: "center",
      wordWrap: false
    })

    loadFont("CaslonAntique")

    // Keep a list of actors that need to prepareData after 'ready' (generally those that rely on other actor data - passengers/mounts)
    game.postReadyPrepare = [];

  });
}
import { generateDhcpScript, saveScriptToFile } from "./scripts/script_dhcp.js"

import { generateCiscoSerialConfigScript } from "./scripts/script_routeur_pyserial.js"
import { generateCiscoConfigScript } from "./scripts/script_routeur_netmiko.js"
// Update the inputs section to get values when needed instead of on page load
let valider = document.getElementById("valider1")
let envoyer = document.getElementById("envoyer")

// the inputs
let adress = document.getElementById("adress")
let sous_reseaux = document.getElementById("sous_reseaux")
let inputcidr = document.getElementById("inputcidr")
let marge = document.getElementById("marge")
// Reference the DOM elements without getting their values immediately
let dns_primaire = document.getElementById("dns_primaire")
let dns_secondaire = document.getElementById("dns_secondaire")
let gateway_position = document.getElementById("gateway_position")
let serveur_ntp = document.getElementById("serveur_ntp")
let nom_domaine = document.getElementById("nom_domaine")

//les divs
let boxzone = document.getElementById("boxzone")
let content = document.getElementById("content")
let para = document.getElementById("para")
let body = document.getElementById("body")

// element dont l'apparence vont changer
let inputs = document.getElementById("inputs")
let boxadresses = document.getElementById("boxadresses")
let retour = document.getElementById("retour")

// initialisation de variables à 0
let nextadress = 0
let machineval = 0
let premieradress = 0
let dernieradress = 0
let broadcast = 0
let nbreseaux = 0
let taillelistbox = 0
let listbox = []
let buttonaddexist = false
let nbadress = 0
let plusdereseau = false
let alrdnomore = false
let inputvide = false
let validerform = true

// Tableau pour stocker tous les résultats de chaque itération
let resultsArray = []

// fonction qui permet de corriger une adresse
//si une valeur dépasse 255 ou devient inferieur à 0
function correction(adresse) {
  for (let i = 3; i > 0; i--) {
    if (adresse[i] > 255) {
      adresse[i - 1] = parseInt(adresse[i - 1]) + 1
      adresse[i] = parseInt(adresse[i]) - 256
    } else if (adresse[i] < 0) {
      adresse[i - 1] = parseInt(adresse[i - 1]) - 1
      adresse[i] = parseInt(adresse[i]) + 256
    }
  }
  return adresse
}

// Mettre à jour la valeur de l'input avec les groupes corrigés

// Add this function right after the formatInput function
function calculateMaxHosts() {
  if (inputcidr.value.length > 1) {
    let cidr = parseInt(inputcidr.value.replace("/", ""))
    let maxHosts = Math.pow(2, 32 - cidr) - 2 // Subtract 2 for network and broadcast addresses

    // Create or update the max hosts display
    let maxHostsDisplay = document.getElementById("max-hosts-display")
    if (!maxHostsDisplay) {
      maxHostsDisplay = document.createElement("div")
      maxHostsDisplay.id = "max-hosts-display"
      maxHostsDisplay.style.color = "#0066cc"
      maxHostsDisplay.style.marginTop = "5px"
      maxHostsDisplay.style.fontSize = "14px"
      inputcidr.parentNode.appendChild(maxHostsDisplay)
    }
    maxHostsDisplay.textContent = `Hôtes disponibles: ${maxHosts.toLocaleString()}`
  }
}
inputcidr.addEventListener("change", calculateMaxHosts)
inputcidr.addEventListener("input", calculateMaxHosts)
inputcidr.value = "/"
inputcidr.addEventListener("input", () => {
  // Remplacer tous les caractères non numériques ou "/" par une chaîne vide
  inputcidr.value = inputcidr.value.replace(/[^0-9/]/g, "")

  // Mettre à jour la valeur de l'entrée avec la valeur filtrée

  if (inputcidr.value.length > 3) {
    inputcidr.value = inputcidr.value.substring(0, 3)
  }
  if (
    inputcidr.value[1] + inputcidr.value[2] > "32" ||
    inputcidr.value[2] === "/"
  ) {
    inputcidr.value = "/" + inputcidr.value[1]
  }
  if (
    inputcidr.value.length === 0 ||
    inputcidr.value[0] != "/" ||
    inputcidr.value[1] === "0" ||
    inputcidr.value[1] === "/"
  ) {
    inputcidr.value = "/"
  }
})
function updateValue() {
  let numericValue = marge.value.replace(/[^0-9]/g, "") // Garder seulement les chiffres

  if (numericValue.length > 2) {
    numericValue = numericValue.substring(0, 2) // Limite à 2 chiffres max
  }

  if (numericValue.startsWith("0") && numericValue.length > 1) {
    numericValue = numericValue.substring(1) // Éviter un "0" inutile devant
  }

  // Ajouter % seulement s'il y a au moins un chiffre
  marge.value = numericValue.length > 0 ? numericValue + "%" : ""
}

// Gestion du backspace pour supprimer les chiffres et garder %
marge.addEventListener("keydown", (e) => {
  if (e.key === "Backspace") {
    let numericValue = marge.value.replace(/[^0-9]/g, "") // Récupérer seulement les chiffres
    if (numericValue.length > 0) {
      e.preventDefault() // Empêcher la suppression normale
      numericValue = numericValue.slice(0, -1) // Supprimer le dernier chiffre
      marge.value = numericValue.length > 0 ? numericValue + "%" : "" // Mettre à jour l'affichage
    }
  }
})

// Appliquer la mise à jour lors de la saisie
marge.addEventListener("input", updateValue)
sous_reseaux.addEventListener("input", () => {
  sous_reseaux.value = sous_reseaux.value.replace(/[^0-9]/g, "")
  if (sous_reseaux.value.length > 3) {
    sous_reseaux.value = sous_reseaux.value.substring(0, 3)
  }
  if (sous_reseaux.value[0] === "0") {
    sous_reseaux.value = "1"
  }
})

// fonction qui permet de creer des box pour chaque sous réseau necessaire
function inputbox() {
  let boxconf = document.createElement("div")
  boxconf.setAttribute("id", "boxconf")

  let supprimer = document.createElement("button")
  supprimer.textContent = "x"
  supprimer.setAttribute("id", "supprimer")

  let boxnh = document.createElement("div")
  boxnh.setAttribute("id", "boxnh")

  //crée la div pour les noms de réseaux
  let boxname = document.createElement("div")
  let namechar = document.createElement("p")
  namechar.textContent = "Entrer le nom pour ce sous réseau "
  let nameinput = document.createElement("input")
  nameinput.setAttribute("type", "text")
  nameinput.setAttribute("value", "sous_réseau" + (listbox.length + 1))

  boxname.appendChild(namechar)
  boxname.appendChild(nameinput)

  // Crée la div pour le nombre de machines nécessaires
  let boxhost = document.createElement("div")
  let hostchar = document.createElement("p")
  hostchar.textContent = "Entrer le nombre de machines nécessaires"
  let hostinput = document.createElement("input")
  hostinput.setAttribute("type", "number")
  hostinput.setAttribute("placeholder", "ex : 10")

  // Écouteur d'événement pour arrondir vers l'entier supérieur
  hostinput.addEventListener("input", () => {
    let value = parseFloat(hostinput.value)
    if (!isNaN(value)) {
      // Arrondir vers l'entier supérieur
      hostinput.value = Math.ceil(value)
    }
    // Limiter à 5 chiffres
    if (hostinput.value.length > 5) {
      hostinput.value = hostinput.value.substring(0, 5)
    }
    // Éviter un "0" inutile devant
    if (hostinput.value[0] === "0") {
      hostinput.value = "1"
    }
  })
  boxhost.appendChild(hostchar)
  boxhost.appendChild(hostinput)

  // ajouter les elements dans les div
  boxnh.appendChild(boxname)
  boxnh.appendChild(boxhost)
  boxconf.appendChild(boxnh)
  boxconf.appendChild(supprimer)
  content.appendChild(boxconf)
  listbox.push(boxconf)
  supprimer.addEventListener("click", () => {
    content.removeChild(boxconf)

    const index = listbox.indexOf(boxconf)
    if (index !== -1) {
      listbox.splice(index, 1)
    }

    for (let i = 0; i < listbox.length; i++) {
      listbox[i].children[0].children[0].children[1].value =
        "sous_réseau" + (i + 1)
    }
  })
}
retour.style.display = "none"
para.style.display = "none"
// Fermer la boîte
function closeBoxzone() {
  const boxzone = document.getElementById("boxzone")
  boxzone.classList.add("closing")
}

// Ouvrir la boîte
function openBoxzone() {
  const boxzone = document.getElementById("boxzone")

  // Si la boîte est complètement cachée (display: none)
  if (boxzone.style.display === "none") {
    boxzone.style.display = "block"
    // Petit délai pour permettre au navigateur de traiter le changement
    setTimeout(() => {
      boxzone.classList.remove("closing")
    }, 100)
  } else {
    // Si la boîte est juste "fermée" mais toujours dans le DOM
    boxzone.classList.remove("closing")
  }
}
valider.addEventListener("click", () => {
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    })
  }, 100)
  if (validerform) {
    if (
      adress.value.length === 0 ||
      inputcidr.value.length === 1 ||
      sous_reseaux.value.length === 0
    ) {
      alert("veuillez remplir tous les champs")
    } else {
      // changer l'apparence des elements

      inputs.style.maxHeight = "0"
      openBoxzone()
      envoyer.style.display = "block"
      para.style.height = "500px"
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      })
      valider.innerHTML = "modifier"
      validerform = false

      para.style.display = "block"
      nbreseaux = sous_reseaux.value
      taillelistbox = listbox.length
      let addbox = nbreseaux - taillelistbox
      if (addbox < 0) {
        for (let i = 0; i < -addbox; i++) {
          content.removeChild(listbox.pop())
        }
      } else {
        for (let i = 1; i <= addbox; i++) {
          inputbox()
        }
      }
      if (!buttonaddexist) {
        let buttonadd = document.createElement("button")
        buttonaddexist = true
        buttonadd.setAttribute("id", "buttonadd")
        buttonadd.textContent = "ajouter"
        buttonadd.setAttribute("class", "mainbutton")
        boxzone.appendChild(buttonadd)
        buttonadd.addEventListener("click", () => {
          inputbox()
          boxzone.scrollTo({
            top: boxzone.scrollHeight,
            behavior: "smooth",
          })
        })
      }
    }
  } else {
    inputs.style.maxHeight = "1000px"
    valider.innerHTML = "valider"
    validerform = true
    para.style.height = "75px"
    closeBoxzone()
    envoyer.style.display = "block"
  }
})
retour.addEventListener("click", () => {
  // Reload the page without showing the refresh
  window.location.reload(true);
});
  
// bouton permettant de valider les informations et de calculer les adresses
envoyer.addEventListener("click", () => {
  // Réinitialiser le tableau des résultats pour une nouvelle exécution
  resultsArray = []
  nbadress = 0 // Ajouter cette ligne
  plusdereseau = false
  alrdnomore = false
  
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    })
  }, 880)
  for (let i = 0; i < listbox.length; i++) {
    if (
      listbox[i].children[0].children[0].children[1].value.length === 0 ||
      listbox[i].children[0].children[1].children[1].value.length === 0
    ) {
      inputvide = true
    }
  }
  if (
    inputvide ||
    adress.value.split(".").length !== 4 ||
    inputcidr.value.length === 1
  ) {
    alert("veuillez remplir tous les champs")
    inputvide = false
  } else {
    // definir le nombre total d'adresses
    let nbtotaladress = inputcidr.value.replace("/", "")
    nbtotaladress = 2 ** (32 - nbtotaladress)

    // trier la boxlist par ordre décroissant de machine
    listbox.sort((a, b) => {
      return (
        b.children[0].children[1].children[1].value -
        a.children[0].children[1].children[1].value
      )
    })
    //afficher l'adresse et le cidr d'origine
    let adressorigin = document.createElement("p")
    adressorigin.textContent = "adresse d'origine : " + adress.value

    let cidrorigin = document.createElement("p")
    cidrorigin.textContent = "cidr d'origine :" + inputcidr.value

    boxzone.appendChild(adressorigin)
    boxzone.appendChild(cidrorigin)

    for (let x = 0; x < listbox.length; x++) {
      // Objet pour stocker les résultats de cette itération
      let iterationResult = {}

      // definir l'adresse d'origine si se n'est pas la
      // premiere fois alors elle devient l'adresse du prochain reseau du reseau precedent.
      if (nextadress != 0) {
        adressorigin = [...nextadress]
      } else {
        adressorigin = adress.value.split(".")
      }
      // initialisation des variables qui se reinitialisent à chaque execution du bouton
      let octetpas = 0
      let machinemarge = 0
      let maskval = 32
      let i = 0
      let puissance = 0
      let indiceoctet = 0
      let mask = []
      let mask_decimal = []

      // =====determiner le masque=====

      // trouver la puissance de 2 superieur à la valeur de machine

      // ajouter la marge a machineval
      machinemarge =
        (listbox[x].children[0].children[1].children[1].value / 100) *
        marge.value.replace("%", "")

      // Calculer machineval sans arrondi
      machineval =
        Number(listbox[x].children[0].children[1].children[1].value) +
        Number(machinemarge) +
        2

      // Arrondir vers l'entier supérieur après avoir ajouté la marge
      machineval = Math.ceil(machineval)
      nbadress = Number(nbadress) + Number(machineval)
      while (2 ** i < machineval) {
        i++
      }
      puissance = i

      // determiner le nombre de bit à 1 puis crée le masque en binaire
      maskval = maskval - puissance
      for (let i = 0; i < maskval; i++) {
        mask.push(1)
      }
      for (let i = 0; i < 32 - maskval; i++) {
        mask.push(0)
      }
      let octet1 = mask.slice(0, 8)
      let octet2 = mask.slice(8, 16)
      let octet3 = mask.slice(16, 24)
      let octet4 = mask.slice(24, 32)
      mask = [
        octet1.join(""),
        octet2.join(""),
        octet3.join(""),
        octet4.join(""),
      ]

      // convertir le masque en decimal
      mask.forEach(function (octet) {
        mask_decimal.push(parseInt(octet, 2))
      })

      // trouver le pas
      for (let t = 0; t < 4; t++) {
        if (mask_decimal[t] != 255) {
          octetpas = mask_decimal[t]
          indiceoctet = t
          break
        }
      }
      let pas = 256 - octetpas

      //calculer l'adresse du prochain reseau
      nextadress = [...adressorigin]
      nextadress[indiceoctet] = parseInt(nextadress[indiceoctet]) + pas
      correction(nextadress)

      //calculer la premiere adresse exploitable
      premieradress = [...adressorigin]
      premieradress[3] = parseInt(premieradress[3]) + 1
      correction(premieradress)
      let adressmanquante = nbadress - nbtotaladress
      let octetorigin = inputcidr.value.replace("/", "")
      octetorigin = octetorigin / 8
      if (nbadress > nbtotaladress) {
        let lastadress = adress.value.split(".")
        for (let o = octetorigin; o <= 3; o++) {
          lastadress[o] = 255
        }
        broadcast = [...lastadress]
        dernieradress = [...lastadress]
        dernieradress[3] = parseInt(dernieradress[3]) - 1

        // definir le nom du sous reseau
      } else {
        //calculer la derniere adresse exploitable
        dernieradress = [...nextadress]
        dernieradress[3] = parseInt(dernieradress[3]) - 2
        correction(dernieradress)

        //calculer le broadcast
        broadcast = [...nextadress]
        broadcast[3] = parseInt(broadcast[3]) - 1
        correction(broadcast)
        // definir le nom du sous reseau
      }
      let netname = listbox[x].children[0].children[0].children[1].value
      adressorigin = adressorigin
      if (nbadress > nbtotaladress && !alrdnomore) {
        netname = netname + "(adresse manquante :" + adressmanquante + ")"
        alrdnomore = true
      }
      let octetfix = inputcidr.value.replace("/", "")
      octetfix = octetfix / 8 - 1
      if (nbadress > nbtotaladress) {
        plusdereseau = true
      }

      // Calculate gateway address based on gateway_position
      let gatewayAddress = []
      if (gateway_position.value === "debut") {
        gatewayAddress = [...premieradress] // First usable address
      } else {
        // "fin" or default
        gatewayAddress = [...dernieradress] // Last usable address
      }

      // Stocker tous les résultats de cette itération dans l'objet
      iterationResult = {
        nom: netname,
        adresseReseau: [...adressorigin],
        masque: [...mask_decimal],
        premièreAdresse: [...premieradress],
        dernièreAdresse: [...dernieradress],
        broadcast: [...broadcast],
        cidr: maskval,
        nombreMachines: machineval,
        pasDeReseau: plusdereseau,
        gateway: gatewayAddress, // Add gateway address to results
      }

      // Ajouter les résultats de cette itération au tableau
      resultsArray.push(iterationResult)

      //afficher les resultats
      let testbroadcast = adress.value.split(".")
      boxadresses.style.display = "none"
      boxzone.style.height = "0"
      setTimeout(() => {
        boxzone.style.height = "530px"
        para.style.height = "auto"
      }, 500)
      setTimeout(() => {
        para.style.height = "500px"
        envoyer.style.display = "none"
        content.style.display = "none"
        boxzone.style.display = "block"
      }, 450)
      // resultbox(adressorigin, mask_decimal, premieradress, dernieradress, broadcast, maskval, netname)
      showTableView()
      if (plusdereseau) {
        break
      }
    }

    // Afficher le tableau des résultats dans la console pour vérification
    // console.log("Résultats de tous les sous-réseaux:", resultsArray)
    const dhcpOptions = {
      serverIP: "192.168.100.10", // Default value - could be derived from network calculation
      defaultGateway:
        resultsArray.length > 0
          ? resultsArray[0].gateway.join(".")
          : "192.168.100.1",
      networkInterfaceAlias: "Ethernet",
      includeDnsServer: true,
      dnsServerPrimary: dns_primaire.value || "8.8.8.8",
      dnsServerSecondary: dns_secondaire.value || "",
      ntpServer: serveur_ntp.value || "",
      domainName: nom_domaine.value || "",
    }

    // Générer le script DHCP à partir des résultats
    const dhcpScript = generateDhcpScript(resultsArray, dhcpOptions)

    // Pass the new parameters to the Cisco script generators
    const pythonScriptConsole = generateCiscoSerialConfigScript(resultsArray, {
      gatewayPosition: gateway_position.value,
      ntpServer: serveur_ntp.value,
      dnsServerPrimary: dns_primaire.value,
      dnsServerSecondary: dns_secondaire.value,
      domainName: nom_domaine.value,
    })

    const pythonScriptSSH = generateCiscoConfigScript(resultsArray, {
      gatewayPosition: gateway_position.value,
      ntpServer: serveur_ntp.value,
      dnsServerPrimary: dns_primaire.value,
      dnsServerSecondary: dns_secondaire.value,
      domainName: nom_domaine.value,
    })

    // Fonctions pour les nouveaux boutons (à ajouter juste avant le dernier crochet fermant)

    // Fonction pour télécharger les résultats au format Excel
    function downloadPDF() {
      let scriptsLoaded = {
        jspdf: false,
        html2canvas: false,
      }

      function checkScriptsLoaded() {
        if (scriptsLoaded.jspdf && scriptsLoaded.html2canvas) {
          setTimeout(generatePDF, 100)
        }
      }

      if (typeof jspdf !== "undefined" && typeof html2canvas !== "undefined") {
        generatePDF()
      } else {
        if (typeof jspdf === "undefined") {
          const script = document.createElement("script")
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
          script.onload = function () {
            scriptsLoaded.jspdf = true
            checkScriptsLoaded()
          }
          document.head.appendChild(script)
        } else {
          scriptsLoaded.jspdf = true
        }

        if (typeof html2canvas === "undefined") {
          const html2canvasScript = document.createElement("script")
          html2canvasScript.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
          html2canvasScript.onload = function () {
            scriptsLoaded.html2canvas = true
            checkScriptsLoaded()
          }
          document.head.appendChild(html2canvasScript)
        } else {
          scriptsLoaded.html2canvas = true
        }

        checkScriptsLoaded()
      }

      function generatePDF() {
        const tempDiv = document.createElement("div")
        tempDiv.id = "temp-pdf-container"
        tempDiv.style.position = "absolute"
        tempDiv.style.left = "-9999px"
        document.body.appendChild(tempDiv)

        tempDiv.innerHTML = `
          <div id="pdf-content" style="padding: 20px; background-color: white; color: black; font-family: Arial, sans-serif;">
              <h1 style="text-align: center; color: black; text-shadow: none;">Résultats du découpage VLSM</h1>
              <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                      <tr style="background-color: #dddddd;">
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">Nom du réseau</th>
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">Adresse réseau</th>
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">Masque</th>
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">CIDR</th>
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">Première adresse</th>
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">Dernière adresse</th>
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">Broadcast</th>
                          <th style="border: 1px solid black; padding: 8px; text-align: left; color: black;">Nb Hotes</th>
                      </tr>
                  </thead>
                  <tbody id="pdf-table-body">
                  </tbody>
              </table>
          </div>`

        const tbody = tempDiv.querySelector("#pdf-table-body")

        resultsArray.forEach((result, index) => {
          if (!result.pasDeReseau) {
            const row = document.createElement("tr")
            row.style.backgroundColor = index % 2 === 1 ? "#f9f9f9" : "#ffffff"
            row.style.color = "black"

            const cells = [
              result.nom,
              result.adresseReseau.join("."),
              result.masque.join("."),
              "/" + result.cidr,
              result.premièreAdresse.join("."),
              result.dernièreAdresse.join("."),
              result.broadcast.join("."),
              result.nombreMachines - 2,
            ]

            cells.forEach((cellText) => {
              const td = document.createElement("td")
              td.textContent = cellText
              td.style.border = "1px solid black"
              td.style.padding = "8px"
              td.style.textAlign = "left"
              td.style.color = "black"
              row.appendChild(td)
            })

            tbody.appendChild(row)
          }
        })

        setTimeout(() => {
          const element = document.getElementById("pdf-content")
          if (!element) return

          html2canvas(element, { scale: 2, backgroundColor: "#ffffff" })
            .then((canvas) => {
              const imgData = canvas.toDataURL("image/png")
              const pdf = new jspdf.jsPDF("l", "mm", "a4")
              const pdfWidth = pdf.internal.pageSize.getWidth()
              const pdfHeight = pdf.internal.pageSize.getHeight()
              const imgWidth = canvas.width
              const imgHeight = canvas.height
              const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
              const imgX = (pdfWidth - imgWidth * ratio) / 2

              pdf.addImage(
                imgData,
                "PNG",
                imgX,
                10,
                imgWidth * ratio,
                imgHeight * ratio
              )
              pdf.save("resultats_vlsm.pdf")
              document.body.removeChild(tempDiv)
            })
            .catch((error) => {
              console.error("Erreur lors de la génération du PDF:", error)
              alert("Erreur lors de la génération du PDF. Veuillez réessayer.")
              document.body.removeChild(tempDiv)
            })
        }, 500)
      }
    }
    function downloadCSV() {
      // Création du contenu CSV
      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Nom,Adresse réseau,Masque,CIDR,Première adresse,Dernière adresse,Broadcast,Nb Hotes\n" +
        resultsArray
          .map((result) => {
            if (!result.pasDeReseau) {
              return [
                result.nom,
                result.adresseReseau.join("."),
                result.masque.join("."),
                "/" + result.cidr,
                result.premièreAdresse.join("."),
                result.dernièreAdresse.join("."),
                result.broadcast.join("."),
                result.nombreMachines - 2,
              ].join(",")
            }
            return null
          })
          .filter(Boolean)
          .join("\n")

      // Encodage des caractères spéciaux pour l'URL
      const encodedUri = encodeURI(csvContent)

      // Création d'un lien temporaire pour déclencher le téléchargement
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", "resultats_reseaux.csv")

      // Ajout du lien au document
      document.body.appendChild(link)

      // Déclenchement du téléchargement
      link.click()

      // Suppression du lien temporaire
      document.body.removeChild(link)
    }
    // Modify the showTableView function to have dark neon styling for error messages
    function showTableView() {
      // Vider le contenu actuel
      boxzone.innerHTML = ""

      // Vérifier si nous avons des résultats à afficher
      if (resultsArray.length === 0) {
        alert(
          "Aucun résultat à afficher. Veuillez d'abord calculer le découpage VLSM."
        )
        return
      }

      // Ajouter l'adresse et le cidr d'origine au début
      let adressOriginElement = document.createElement("p")
      adressOriginElement.textContent = "Adresse d'origine : " + adress.value

      let cidrOriginElement = document.createElement("p")
      cidrOriginElement.textContent = "CIDR d'origine : " + inputcidr.value

      boxzone.appendChild(adressOriginElement)
      boxzone.appendChild(cidrOriginElement)

      // Vérifier si des réseaux ont manqué d'adresses
      const hasInsufficientAddresses = resultsArray.some(
        (result) => result.pasDeReseau
      )

      if (hasInsufficientAddresses) {
        const warningMessage = document.createElement("div")
        // Style néon sombre pour le message d'avertissement
        warningMessage.style.backgroundColor = "#1a1a2e"
        warningMessage.style.color = "#ff2e63"
        warningMessage.style.padding = "10px"
        warningMessage.style.marginBottom = "15px"
        warningMessage.style.borderRadius = "5px"
        warningMessage.style.border = "1px solid #ff2e63"
        warningMessage.style.boxShadow = "0 0 10px rgba(255, 46, 99, 0.5)"
        warningMessage.style.textShadow = "0 0 5px rgba(255, 46, 99, 0.7)"
        warningMessage.innerHTML =
          "<strong>Attention :</strong> Certains sous-réseaux n'ont pas pu être créés car il n'y a pas assez d'adresses disponibles avec le CIDR spécifié."
        boxzone.appendChild(warningMessage)
      }

      // Créer un tableau pour afficher les résultats
      const table = document.createElement("table")
      table.setAttribute("id", "resultTable")
      table.classList.add("vlsm-table")

      // Créer l'en-tête du tableau
      const thead = document.createElement("thead")
      const headerRow = document.createElement("tr")
      const headers = [
        "Nom",
        "Adresse réseau",
        "Masque",
        "CIDR",
        "Première adresse",
        "Dernière adresse",
        "Broadcast",
        "Nb hotes",
      ]

      headers.forEach((headerText) => {
        const th = document.createElement("th")
        th.textContent = headerText
        headerRow.appendChild(th)
      })

      thead.appendChild(headerRow)
      table.appendChild(thead)

      // Créer le corps du tableau
      const tbody = document.createElement("tbody")

      let hasValidNetworks = false

      resultsArray.forEach((result) => {
        const row = document.createElement("tr")

        if (result.pasDeReseau) {
          // Pour les réseaux sans assez d'adresses, utiliser un style néon sombre
          row.style.backgroundColor = "#1a1a2e"

          const nameCell = document.createElement("td")
          nameCell.textContent = result.nom
          nameCell.style.color = "#ff2e63"
          nameCell.style.textShadow = "0 0 5px rgba(255, 46, 99, 0.7)"

          const errorCell = document.createElement("td")
          errorCell.colSpan = 7
          errorCell.textContent =
            "Pas assez d'adresses disponibles pour ce sous-réseau"
          errorCell.style.color = "#ff2e63"
          errorCell.style.textShadow = "0 0 5px rgba(255, 46, 99, 0.7)"
          errorCell.style.fontWeight = "bold"

          row.appendChild(nameCell)
          row.appendChild(errorCell)
        } else {
          hasValidNetworks = true
          // Ajouter les cellules pour les réseaux valides
          const cells = [
            result.nom,
            result.adresseReseau.join("."),
            result.masque.join("."),
            "/" + result.cidr,
            result.premièreAdresse.join("."),
            result.dernièreAdresse.join("."),
            result.broadcast.join("."),
            result.nombreMachines - 2,
          ]

          cells.forEach((cellText) => {
            const td = document.createElement("td")
            td.textContent = cellText
            row.appendChild(td)
          })
        }

        tbody.appendChild(row)
      })

      table.appendChild(tbody)
      boxzone.appendChild(table)

      // Si aucun réseau valide n'a été trouvé, ajoutez une note supplémentaire avec style néon
      if (!hasValidNetworks) {
        const noValidNetworksMessage = document.createElement("div")
        noValidNetworksMessage.style.backgroundColor = "#1a1a2e"
        noValidNetworksMessage.style.color = "#ff2e63"
        noValidNetworksMessage.style.padding = "10px"
        noValidNetworksMessage.style.marginTop = "15px"
        noValidNetworksMessage.style.borderRadius = "5px"
        noValidNetworksMessage.style.border = "1px solid #ff2e63"
        noValidNetworksMessage.style.boxShadow =
          "0 0 10px rgba(255, 46, 99, 0.5)"
        noValidNetworksMessage.style.textShadow =
          "0 0 5px rgba(255, 46, 99, 0.7)"
        noValidNetworksMessage.innerHTML =
          "<strong>Erreur :</strong> Aucun sous-réseau n'a pu être créé avec le CIDR spécifié. Veuillez utiliser un CIDR plus petit (ex: /16 au lieu de /24) ou réduire le nombre d'hôtes demandés."
        boxzone.appendChild(noValidNetworksMessage)
      }
    }

    // Fonction pour créer les boutons d'action
    function createActionButtons() {
      // Supprimer les boutons existants si présents
      const existingButtons = document.getElementById("actionButtons")
      if (existingButtons) {
        existingButtons.remove()
      }

      // Créer un conteneur pour les boutons
      const buttonContainer = document.createElement("div")
      buttonContainer.setAttribute("id", "actionButtons")
      buttonContainer.style.display = "flex"
      buttonContainer.style.justifyContent = "center"
      buttonContainer.style.gap = "10px"
      buttonContainer.style.marginTop = "20px"
      buttonContainer.style.flexWrap = "wrap" // Pour permettre le retour à la ligne si l'écran est petit

      // Bouton pour télécharger en Excel (CSV)
      const downloadButton = document.createElement("button")
      downloadButton.textContent = "Télécharger PDF"
      downloadButton.classList.add("mainbutton")
      downloadButton.addEventListener("click", downloadPDF)
      // bouton pour telecharger un fichier csv
      const csvButton = document.createElement("button")
      csvButton.textContent = "Télécharger CSV"
      csvButton.classList.add("mainbutton")
      csvButton.addEventListener("click", downloadCSV)

      // Bouton DHCP (nouveau)
      const dhcpButton = document.createElement("button")
      dhcpButton.textContent = "Script DHCP"
      dhcpButton.classList.add("mainbutton")
      dhcpButton.addEventListener("click", () => {
        // Sauvegarder le script dans un fichier
        saveScriptToFile(dhcpScript, "config-dhcp.ps1")
      })

      // Bouton ROUTEUR (nouveau)
      const routeurButton = document.createElement("button")
      routeurButton.textContent = "ROUTEUR SSH"
      routeurButton.classList.add("mainbutton")
      routeurButton.addEventListener("click", () => {
        saveScriptToFile(pythonScriptSSH, "config-routeur-ssh.py")
      })
      // Bouton ROUTEUR (nouveau)
      const routeurButton2 = document.createElement("button")
      routeurButton2.textContent = "ROUTEUR Console"
      routeurButton2.classList.add("mainbutton")
      routeurButton2.addEventListener("click", () => {
        saveScriptToFile(pythonScriptConsole, "config-routeur-console.py")
      })

      // Ajouter les boutons au conteneur
      buttonContainer.appendChild(downloadButton)
      buttonContainer.appendChild(csvButton)
      buttonContainer.appendChild(dhcpButton)
      buttonContainer.appendChild(routeurButton)
      buttonContainer.appendChild(routeurButton2)

      let footer = document.querySelector("footer")
      // Ajouter le conteneur à la fin du body
      document.body.insertBefore(buttonContainer, footer)
    }
    const additionalStyle = document.createElement("style")

    document.head.appendChild(additionalStyle)
    // Modifier la fonction envoyer.addEventListener pour ajouter les boutons à la fin
    // Trouve cette partie dans le code original:
    envoyer.addEventListener("click", () => {
      // Code existant...

      // À la fin de cette fonction, juste avant la dernière accolade, ajouter:
      // Créer les boutons d'action après avoir affiché tous les résultats
      createActionButtons()
    })

    // Ajouter du CSS pour le tableau de résultats
    const style = document.createElement("style")
    retour.style.display = "block"
    document.head.appendChild(style)
    createActionButtons()
  }
})

// permet d'assigner le bouton valider à la touche entrée
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    valider.click()
  }
})

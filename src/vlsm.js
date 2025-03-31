// les boutons
let valider = document.getElementById('valider1');
let envoyer = document.getElementById('envoyer');

// les inputs
let adress = document.getElementById('adress');
let sous_reseaux = document.getElementById('sous_reseaux');
let inputcidr = document.getElementById('inputcidr');
let marge = document.getElementById('marge');

//les divs
let boxzone = document.getElementById('boxzone');
let content = document.getElementById('content');
let para = document.getElementById('para');


// les champs de textes
let premierex = document.getElementById('premierex');
let dernierex = document.getElementById('dernierex');
let adressbroadcast = document.getElementById('adressbroadcast');
let prochain_reseau = document.getElementById('prochain_reseau');
let masque = document.getElementById('masque');

// element dont l'apparence vont changer
let inputs = document.getElementById('inputs');
let boxadresses = document.getElementById('boxadresses');

// initialisation de variables à 0
let nextadress = 0
let machineval = 0;
let premieradress = 0;
let dernieradress = 0;
let broadcast = 0;
let adressorigin = 0;
let nbreseau = 0;
let taillelistbox = 0;
let listbox = [];
let buttonaddexist = false;
let nbadress = 0;
let plusdereseau = false;
let alrdnomore = false;
let inputvide = false;
let validerform = true;
// faire disparaitre certains elements au debut


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
function formatInput(input) {

    // Supprimer tous les caractères non numériques et non points
    let value = input.value.replace(/[^\d.]/g, '');

    // Supprimer les points excédentaires
    value = value.replace(/\.{2,}/g, '.');

    // Insérer un point après chaque groupe de trois chiffres
    value = value.replace(/(\d{3})(?=\d)/g, '$1.');

    // Limiter à quatre groupes de trois chiffres
    let groups = value.split('.');
    groups = groups.slice(0, 4);

    if (groups.length === 4 && groups[3].charAt(0) === '0') {
        groups[3] = '0';
    }

    // Ajouter un point après un '0' si c'est le premier caractère du groupe
    value = groups.join('.').replace(/(?<=^|\.)0(?=\d)/g, '0.');

    // Limiter à quinze caractères (quatre groupes de trois chiffres et trois points)
    value = value.substring(0, 15);

    // Si la longueur de la valeur dépasse 12 (quatre groupes de trois chiffres)
    // et si le dernier caractère est un point, supprimez-le
    if (value.length > 12 && value.charAt(value.length - 1) === '.') {
        value = value.substring(0, value.length - 1);
    }

    // Corriger si une valeur dépasse 255 ou devient inférieure à 0
    let group = value.split('.');
    for (let i = 0; i < group.length; i++) {
        if (group[i] > 255) {
            group[i] = '255';
        }
        if (group[i] < 0) {
            group[i] = '0';
        }
    }

    // Mettre à jour la valeur de l'input avec les groupes corrigés
    input.value = group.join('.');


}

inputcidr.value = '/';
inputcidr.addEventListener('input', () => {

    // Remplacer tous les caractères non numériques ou "/" par une chaîne vide
    inputcidr.value = inputcidr.value.replace(/[^0-9/]/g, '');

    // Mettre à jour la valeur de l'entrée avec la valeur filtrée

    if (inputcidr.value.length > 3) {
        inputcidr.value = inputcidr.value.substring(0, 3);
    }
    if (inputcidr.value[1] + inputcidr.value[2] > '32' || inputcidr.value[2] === '/') {
        inputcidr.value = '/' + inputcidr.value[1];
    }
    if (inputcidr.value.length === 0 || inputcidr.value[0] != '/' || inputcidr.value[1] === '0' || inputcidr.value[1] === '/') {
        inputcidr.value = '/';
    }
});
function updateValue() {
    let numericValue = marge.value.replace(/[^0-9]/g, ''); // Garder seulement les chiffres

    if (numericValue.length > 2) {
        numericValue = numericValue.substring(0, 2); // Limite à 2 chiffres max
    }

    if (numericValue.startsWith('0') && numericValue.length > 1) {
        numericValue = numericValue.substring(1); // Éviter un "0" inutile devant
    }

    // Ajouter % seulement s'il y a au moins un chiffre
    marge.value = numericValue.length > 0 ? numericValue + '%' : '';
}

// Gestion du backspace pour supprimer les chiffres et garder %
marge.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
        let numericValue = marge.value.replace(/[^0-9]/g, ''); // Récupérer seulement les chiffres
        if (numericValue.length > 0) {
            e.preventDefault(); // Empêcher la suppression normale
            numericValue = numericValue.slice(0, -1); // Supprimer le dernier chiffre
            marge.value = numericValue.length > 0 ? numericValue + '%' : ''; // Mettre à jour l'affichage
        }
    }
});

// Appliquer la mise à jour lors de la saisie
marge.addEventListener('input', updateValue);
sous_reseaux.addEventListener('input', () => {
    sous_reseaux.value = sous_reseaux.value.replace(/[^0-9]/g, '');
    if (sous_reseaux.value.length > 3) {
        sous_reseaux.value = sous_reseaux.value.substring(0, 3);
    }
    if (sous_reseaux.value[0] === '0') {
        sous_reseaux.value = '1';
    }

});

// fonction qui permet de creer des box pour chaque sous réseau necessaire
function inputbox() {
    let boxconf = document.createElement('div');
    boxconf.setAttribute('id', 'boxconf');

    let supprimer = document.createElement('button');
    supprimer.textContent = 'x';
    supprimer.setAttribute('id', 'supprimer');

    let boxnh = document.createElement('div');
    boxnh.setAttribute('id', 'boxnh');

    //crée la div pour les noms de réseaux
    let boxname = document.createElement('div');
    let namechar = document.createElement('p');
    namechar.textContent = 'Entrer le nom pour ce sous réseau ';
    let nameinput = document.createElement('input');
    nameinput.setAttribute('type', 'text');
    nameinput.setAttribute('value', 'sous_réseau' + (listbox.length + 1));

    boxname.appendChild(namechar);
    boxname.appendChild(nameinput);

    //crée la div pour le nombres machines necessaires
    let boxhost = document.createElement('div');
    let hostchar = document.createElement('p');
    hostchar.textContent = ('Entrer le nombre de host nécessaire')
    let hostinput = document.createElement('input');
    hostinput.setAttribute('type', 'number');
    hostinput.setAttribute('placeholder', 'ex : 10');
    hostinput.addEventListener('input', () => {
        hostinput.value = hostinput.value.replace(/[^0-9]/g, '');
        if (hostinput.value.length > 5) {
            hostinput.value = hostinput.value.substring(0, 5);
        }
        if (hostinput.value[0] === '0') {
            hostinput.value = '1';
        }

    });
    boxhost.appendChild(hostchar);
    boxhost.appendChild(hostinput);

    // ajouter les elements dans les div
    boxnh.appendChild(boxname);
    boxnh.appendChild(boxhost);
    boxconf.appendChild(boxnh);
    boxconf.appendChild(supprimer);
    content.appendChild(boxconf);
    listbox.push(boxconf);
    supprimer.addEventListener('click', () => {
        content.removeChild(boxconf);


        const index = listbox.indexOf(boxconf);
        if (index !== -1) {
            listbox.splice(index, 1);
        }


        for (let i = 0; i < listbox.length; i++) {
            listbox[i].children[0].children[0].children[1].value = 'sous_réseau' + (i + 1);
        }
    });
}
function resultbox(netadress, mask, first, last, broadcast, cidr, name) {
    // div pour mettre tout les resultats

    let resultbox = document.createElement('div');
    resultbox.setAttribute('id', 'resultbox');
    // affichage du nom du sous reseau
    let resultname = document.createElement('p');
    resultname.setAttribute('id', 'resultname');
    resultname.textContent = name;
    if (plusdereseau) {
        let plusdereseauchar = document.createElement('p');
        plusdereseauchar.setAttribute('id', 'plusdereseauchar');
        plusdereseauchar.textContent = 'il n\'y a pas assez d\'adresse pour ce sous reseau';
        resultbox.appendChild(resultname);
        resultbox.appendChild(plusdereseauchar);

    } else {
        // div pour la premiere ligne de resultat
        let resultfirstline = document.createElement('div');
        resultfirstline.setAttribute('id', 'resultfirstline');
        resultfirstline.setAttribute('class', 'line');

        // div pour la deuxième ligne de resultat
        let resultsecondline = document.createElement('div');
        resultsecondline.setAttribute('id', 'resultsecondline');
        resultsecondline.setAttribute('class', 'line');

        // affichage du prochain reseau 
        let resultadress = document.createElement('p');
        resultadress.setAttribute('id', 'resultadress');
        resultadress.textContent = 'adresse du reseau : ' + netadress.join('.');

        // affichage du masque
        let resultmask = document.createElement('p');
        resultmask.setAttribute('id', 'resultmask');
        resultmask.textContent = 'masque : ' + mask.join('.');

        // affichage de la premiere adresse exploitable
        let resultfirst = document.createElement('p');
        resultfirst.setAttribute('id', 'resultfirst');
        resultfirst.textContent = 'première adresse exploitable : ' + first.join('.');

        // affichage de la derniere adresse exploitable
        let resultlast = document.createElement('p');
        resultlast.setAttribute('id', 'resultlast');
        resultlast.textContent = 'dernière adresse exploitable : ' + last.join('.');

        // affichage de l'adresse de broadcast
        let resultbroadcast = document.createElement('p');
        resultbroadcast.setAttribute('id', 'resultbroadcast');
        resultbroadcast.textContent = 'broadcast : ' + broadcast.join('.');

        // affichage du cidr
        let resultcidr = document.createElement('p');
        resultcidr.setAttribute('id', 'resultcidr');
        resultcidr.textContent = 'cidr : /' + cidr;



        resultfirstline.appendChild(resultadress);
        resultfirstline.appendChild(resultmask);
        resultfirstline.appendChild(resultcidr);
        resultsecondline.appendChild(resultfirst);
        resultsecondline.appendChild(resultlast);
        resultsecondline.appendChild(resultbroadcast);
        resultbox.appendChild(resultname);
        resultbox.appendChild(resultfirstline);
        resultbox.appendChild(resultsecondline);
    }
    boxzone.appendChild(resultbox);

}
para.style.display = 'none';

valider.addEventListener('click', () => {
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
    if (validerform) {
        if (adress.value.length === 0 || inputcidr.value.length === 1 || sous_reseaux.value.length === 0) {
            alert('veuillez remplir tous les champs');
        } else {
            // changer l'apparence des elements
            inputs.style.height = '0';
            boxzone.style.display = 'block';
            envoyer.style.display = 'block';
            para.style.height = '500px';
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
            valider.innerHTML = "modifier";
            validerform = false;

            para.style.display = 'block';
            nbreseaux = sous_reseaux.value;
            taillelistbox = listbox.length;
            let addbox = nbreseaux - taillelistbox;
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
                let buttonadd = document.createElement('button');
                buttonaddexist = true;
                buttonadd.setAttribute('id', 'buttonadd');
                buttonadd.textContent = 'ajouter';
                buttonadd.setAttribute('class', 'mainbutton');
                boxzone.appendChild(buttonadd);
                buttonadd.addEventListener('click', () => {
                    inputbox()
                    boxzone.scrollTo({
                        top: boxzone.scrollHeight,
                        behavior: 'smooth'
                    });
                });

            }
        }

    } else {

        inputs.style.height = '480px';
        valider.innerHTML = 'valider';
        validerform = true;
        para.style.height = '75px';
        boxzone.style.display = 'none';
        envoyer.style.display = 'block';




    }
});

// bouton permettant de valider les informations et de calculer les adresses
envoyer.addEventListener('click', () => {
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 880);
    for (let i = 0; i < listbox.length; i++) {
        if (listbox[i].children[0].children[0].children[1].value.length === 0 || listbox[i].children[0].children[1].children[1].value.length === 0) {
            inputvide = true
        }
    }
    if (inputvide || adress.value.split('.').length !== 4 || inputcidr.value.length === 1) {
        alert('veuillez remplir tous les champs');
        inputvide = false
    }
    else {
        // definir le nombre total d'adresses
        let nbtotaladress = inputcidr.value.replace('/', '');
        nbtotaladress = 2 ** (32 - nbtotaladress);
        console.log(nbtotaladress)


        // trier la boxlist par ordre décroissant de machine
        listbox.sort((a, b) => {
            return b.children[0].children[1].children[1].value - a.children[0].children[1].children[1].value
        });
        //afficher l'adresse et le cidr d'origine
        let adressorigin = document.createElement('p');
        adressorigin.textContent = 'adresse d\'origine : ' + adress.value;

        let cidrorigin = document.createElement('p');
        cidrorigin.textContent = 'cidr d\'origine :' + inputcidr.value;

        boxzone.appendChild(adressorigin);
        boxzone.appendChild(cidrorigin);


        for (let x = 0; x < listbox.length; x++) {


            // definir l'adresse d'origine si se n'est pas la
            // premiere fois alors elle devient l'adresse du prochain reseau du reseau precedent.
            if (nextadress != 0) {
                adressorigin = [...nextadress]
            }
            else {
                adressorigin = adress.value.split('.')
            }
            // initialisation des variables qui se reinitialisent à chaque execution du bouton
            let octetpas = 0;
            let machinemarge = 0;
            let maskval = 32;
            let i = 0
            let puissance = 0
            let indiceoctet = 0
            let mask = [];
            let mask_decimal = [];


            // =====determiner le masque=====

            // trouver la puissance de 2 superieur à la valeur de machine

            // ajouter la marge a machineval 
            machinemarge = listbox[x].children[0].children[1].children[1].value/100 * marge.value.replace('%', '');
        
            machineval = listbox[x].children[0].children[1].children[1].value
            machineval = Number(machineval) + Number(machinemarge)
            machineval = Number(machineval) + 2
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
            let octet1 = mask.slice(0, 8);
            let octet2 = mask.slice(8, 16);
            let octet3 = mask.slice(16, 24);
            let octet4 = mask.slice(24, 32);
            mask = [octet1.join(''), octet2.join(''), octet3.join(''), octet4.join('')];

            // convertir le masque en decimal
            mask.forEach(function (octet) {
                mask_decimal.push(parseInt(octet, 2))

            });

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
            let octetorigin = inputcidr.value.replace('/', '');
            octetorigin = octetorigin / 8
            if (nbadress > nbtotaladress) {

                let lastadress = adress.value.split('.')
                for (let o = octetorigin; o <= 3; o++) {
                    lastadress[o] = 255

                }
                console.log(lastadress)
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
                netname = netname + '(adresse manquante :' + adressmanquante + ')'
                alrdnomore = true
            }
            let octetfix = inputcidr.value.replace('/', '');
            octetfix = octetfix / 8 - 1
            let adressorigincompare = adress.value.split('.')
            for (let i = 0; i <= octetfix; i++) {
                if (adressorigincompare[i] != adressorigin[i]) {
                    plusdereseau = true
                }
            }




            //afficher les resultats

            let testbroadcast = adress.value.split('.')
            boxadresses.style.display = 'none';
            boxzone.style.height = '0';
            setTimeout(() => {
                boxzone.style.height = '530px';
                para.style.height = '600px';

            }, 500);
            setTimeout(() => {
                para.style.height = '500px';
                envoyer.style.display = 'none';
                content.style.display = 'none';
                buttonadd.style.display = 'none';
                boxzone.style.display = 'block';
            }, 450);
            resultbox(adressorigin, mask_decimal, premieradress, dernieradress, broadcast, maskval, netname)
            if (plusdereseau) {
                break
            }
        }
    }
});




// permet d'assigner le bouton valider à la touche entrée
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        valider.click();
    }

})

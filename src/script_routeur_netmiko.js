function generateCiscoConfigScript(resultsArray, filename = "cisco_config.py") {
  // Créer l'en-tête du script Python
  let pythonCode = `import getpass
from netmiko import ConnectHandler
import re

def validate_ip(ip):
    pattern = r'^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.'
    pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.'
    pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.'
    pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
    return bool(re.match(pattern, ip))

def get_valid_input(prompt, validation_func=None):
    while True:
        value = input(prompt)
        if validation_func is None or validation_func(value):
            return value
        print("Entrée invalide. Veuillez réessayer.")

# Information sur les réseaux disponibles
available_networks = [
`

  // Ajouter les informations de chaque réseau calculé
  for (let i = 0; i < resultsArray.length; i++) {
    const network = resultsArray[i]
    // Ne pas inclure les réseaux qui n'ont pas assez d'adresses
    if (network.pasDeReseau) continue

    pythonCode += `    {
        'nom': "${network.nom}",
        'adresse_reseau': "${network.adresseReseau.join(".")}",
        'masque': "${network.masque.join(".")}",
        'premiere_adresse': "${network.premièreAdresse.join(".")}",
        'cidr': ${network.cidr},
        'nombre_machines': ${network.nombreMachines}
    },\n`
  }

  // Fermer la liste des réseaux et continuer avec le reste du script
  pythonCode += `]

# Demander les informations de connexion
print("=== Configuration de la connexion au routeur Cisco ===")
host = get_valid_input("Adresse IP du routeur: ", validate_ip)
username = input("Nom d'utilisateur: ")
password = getpass.getpass("Mot de passe: ")
secret = getpass.getpass("Enable secret: ")

device = {
    'device_type': 'cisco_ios',
    'host': host,
    'username': username,
    'password': password,
    'secret': secret
}

print("\\n=== Réseaux disponibles ===")
for i, network in enumerate(available_networks):
    print(f"{i+1}. {network['nom']} - Réseau: {network['adresse_reseau']}/{network['cidr']} - Machines: {network['nombre_machines']}")

# Configuration des interfaces pour chaque réseau souhaité
interfaces = []
print("\\n=== Configuration des interfaces ===")
while True:
    try:
        choice = input("\\nChoisissez un numéro de réseau (ou 'fin' pour terminer): ")
        if choice.lower() == 'fin':
            break
            
        network_index = int(choice) - 1
        if network_index < 0 or network_index >= len(available_networks):
            print("Choix invalide. Veuillez entrer un numéro dans la liste.")
            continue
            
        selected_network = available_networks[network_index]
        interface_name = input(f"Nom de l'interface pour {selected_network['nom']} (ex: GigabitEthernet0/1): ")
        
        # Prendre la première adresse exploitable comme adresse d'interface par défaut
        default_ip = selected_network['premiere_adresse']
        ip_choice = input(f"Utiliser {default_ip} comme IP d'interface? (o/n, défaut: o): ")
        
        if ip_choice.lower() != 'n':
            ip_address = default_ip
        else:
            ip_address = get_valid_input("Entrez une adresse IP personnalisée: ", validate_ip)
            
        interfaces.append((interface_name, ip_address, selected_network['masque']))
        print(f"Interface {interface_name} configurée avec IP {ip_address}, masque {selected_network['masque']}")
        
    except ValueError:
        print("Veuillez entrer un numéro valide.")

if not interfaces:
    print("Aucune interface configurée. Fin du programme.")
    exit()

try:
    print(f"\\nConnexion à {host}...")
    net_connect = ConnectHandler(**device)
    net_connect.enable()
    commands = ["configure terminal"]
    for name, ip, mask in interfaces:
        commands.append(f"interface {name}")
        commands.append(f"ip address {ip} {mask}")
        commands.append("no shutdown")
        commands.append("exit")
    commands.extend(["end", "write memory"])
    print("\\nApplication de la configuration...")
    output = net_connect.send_config_set(commands)
    print(output)
    net_connect.disconnect()
    print("Configuration terminée avec succès!")
except Exception as e:
    print("Erreur:", e)
`

  // Créer un Blob avec le code Python
  const blob = new Blob([pythonCode], { type: "text/plain" })

  // Créer une URL pour le Blob
  const url = URL.createObjectURL(blob)

  // Créer un élément a pour le téléchargement
  const downloadLink = document.createElement("a")
  downloadLink.href = url
  downloadLink.download = filename

  // Ajouter l'élément au document, cliquer dessus, puis le supprimer
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)

  // Libérer l'URL pour éviter les fuites de mémoire
  setTimeout(() => URL.revokeObjectURL(url), 100)

  return pythonCode
}

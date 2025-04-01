/////// UTILISATION DANS LE DOCUMENT //////////

// function generateCiscoConfigScript(filename = "cisco_config.py") {
//     const pythonCode = `import getpass
// from netmiko import ConnectHandler
// import re

// def validate_ip(ip):
//     pattern = r'^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.'
//     pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.'
//     pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.'
//     pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
//     return bool(re.match(pattern, ip))

// def get_valid_input(prompt, validation_func=None):
//     while True:
//         value = input(prompt)
//         if validation_func is None or validation_func(value):
//             return value
//         print("Entrée invalide. Veuillez réessayer.")

// # Demander les informations de connexion
// print("=== Configuration de la connexion au routeur Cisco ===")
// host = get_valid_input("Adresse IP du routeur: ", validate_ip)
// username = input("Nom d'utilisateur: ")
// password = getpass.getpass("Mot de passe: ")
// secret = getpass.getpass("Enable secret: ")

// device = {
//     'device_type': 'cisco_ios',
//     'host': host,
//     'username': username,
//     'password': password,
//     'secret': secret
// }

// print("\n=== Configuration des interfaces ===")
// interfaces = []
// while True:
//     interface_name = input("Nom de l'interface (ex: GigabitEthernet0/1) ou 'fin' pour terminer: ")
//     if interface_name.lower() == 'fin':
//         break
//     ip_address = get_valid_input("Adresse IP: ", validate_ip)
//     subnet_mask = get_valid_input("Masque de sous-réseau: ", validate_ip)
//     interfaces.append((interface_name, ip_address, subnet_mask))

// try:
//     print(f"Connexion à {host}...")
//     net_connect = ConnectHandler(**device)
//     net_connect.enable()
//     commands = ["configure terminal"]
//     for name, ip, mask in interfaces:
//         commands.append(f"interface {name}")
//         commands.append(f"ip address {ip} {mask}")
//         commands.append("no shutdown")
//         commands.append("exit")
//     commands.extend(["end", "write memory"])
//     print("\nApplication de la configuration...")
//     output = net_connect.send_config_set(commands)
//     print(output)
//     net_connect.disconnect()
//     print("Configuration terminée avec succès!")
// except Exception as e:
//     print("Erreur:", e)
// `;

//     const blob = new Blob([pythonCode], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const downloadLink = document.createElement("a");
//     downloadLink.href = url;
//     downloadLink.download = filename;
//     document.body.appendChild(downloadLink);
//     downloadLink.click();
//     document.body.removeChild(downloadLink);
//     setTimeout(() => URL.revokeObjectURL(url), 100);
// }

// generateCiscoConfigScript();

const fs = require("fs")
const path = require("path");

function generateCiscoConfigScript(filename = "cisco_config.py") {
  const pythonCode = `import getpass
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

print("\\n=== Configuration des interfaces ===")
interfaces = []
while True:
    interface_name = input("Nom de l'interface (ex: GigabitEthernet0/1) ou 'fin' pour terminer: ")
    if interface_name.lower() == 'fin':
        break
    ip_address = get_valid_input("Adresse IP: ", validate_ip)
    subnet_mask = get_valid_input("Masque de sous-réseau: ", validate_ip)
    interfaces.append((interface_name, ip_address, subnet_mask))

try:
    print(f"Connexion à {host}...")
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
`;

  // Créer le dossier output si il n'existe pas
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Spécifier le chemin complet du fichier à générer dans le dossier output
  const filePath = path.join(outputDir, filename);
  
  // Écrire le fichier Python dans le dossier output
  fs.writeFileSync(filePath, pythonCode);
  console.log(`Le fichier ${filename} a été généré avec succès dans le dossier "output".`);
}

generateCiscoConfigScript()

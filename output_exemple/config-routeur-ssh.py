import getpass
from netmiko import ConnectHandler
import re

def validate_ip(ip):
    pattern = r'^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.'
    pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.'
    pattern += r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.'
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
    {
        'nom': "sous_réseau1",
        'adresse_reseau': "192.168.0.0",
        'masque': "255.255.255.0",
        'gateway': "192.168.0.254",
        'cidr': 24,
        'nombre_machines': 204
    },
    {
        'nom': "sous_réseau2",
        'adresse_reseau': "192.168.1.0",
        'masque': "255.255.255.248",
        'gateway': "192.168.1.2",
        'cidr': 29,
        'nombre_machines': 5
    },
]

# Demander les informations de connexion
print("=== Configuration de la connexion au routeur Cisco ===")
host = get_valid_input("Adresse IP du routeur: ", validate_ip)
username = input("Nom d'utilisateur: ")
password = getpass.getpass("Mot de passe: ")
secret = getpass.getpass("Enable secret: ")

# Configuration pour le périphérique
device = {
    'device_type': 'cisco_ios',
    'host': host,
    'username': username,
    'password': password,
    'secret': secret,
    'session_log': 'netmiko_session.log',
    'timeout': 90,
}

# Afficher les réseaux disponibles
print("\n=== Réseaux disponibles ===")
for i, network in enumerate(available_networks):
    print(f"{i+1}. {network['nom']} - Réseau: {network['adresse_reseau']}/{network['cidr']} - Machines: {network['nombre_machines']}")

# Configuration des interfaces
interfaces = []
print("\n=== Configuration des interfaces ===")
while True:
    choice = input("\nChoisissez un numéro de réseau (ou 'fin' pour terminer): ")
    if choice.lower() == 'fin':
        break
        
    try:
        network_index = int(choice) - 1
        if network_index < 0 or network_index >= len(available_networks):
            print("Choix invalide. Veuillez entrer un numéro dans la liste.")
            continue
            
        selected_network = available_networks[network_index]
        interface_name = input(f"Nom de l'interface pour {selected_network['nom']} (ex: GigabitEthernet0/1): ")
        
        # Adresse d'interface par défaut
        default_ip = selected_network['gateway']
        ip_choice = input(f"Utiliser {default_ip} comme IP d'interface? (o/n, défaut: o): ")
        
        ip_address = default_ip if ip_choice.lower() != 'n' else get_valid_input("Entrez une adresse IP personnalisée: ", validate_ip)
            
        interfaces.append((interface_name, ip_address, selected_network['masque']))
        print(f"Interface {interface_name} configurée avec IP {ip_address}, masque {selected_network['masque']}")
        
    except ValueError:
        print("Veuillez entrer un numéro valide.")

if not interfaces:
    print("Aucune interface configurée. Fin du programme.")
    exit()

try:
    print(f"\nConnexion à {host}...")
    
    # Établissement de la connexion
    net_connect = ConnectHandler(**device)
    print("Connexion établie!")
    
    # Entrer en mode enable
    net_connect.enable()
    print("Mode privilégié activé.")

    # Application de la configuration
    print("\nApplication de la configuration...")
    
    # Entrer en mode de configuration
    output = net_connect.send_command_timing("configure terminal")
    print(f"Configuration terminale: {output}")
    
    # Configurer chaque interface
    for name, ip, mask in interfaces:
        print(f"Configuration de l'interface {name}...")
        net_connect.send_command_timing(f"interface {name}")
        net_connect.send_command_timing("no ip address")
        net_connect.send_command_timing(f"ip address {ip} {mask}")
        net_connect.send_command_timing("no shutdown")
        net_connect.send_command_timing("exit")
        print(f"Interface {name} configurée.")
    
    # Sauvegarder et quitter
    net_connect.send_command_timing("end")
    save_output = net_connect.send_command_timing("write memory")
    print(f"Sauvegarde de la configuration: {save_output}")
    
    # Vérifier la configuration
    for name, ip, mask in interfaces:
        print(f"\nVérification de {name}:")
        show_output = net_connect.send_command_timing(f"show interface {name} | include protocol|address")
        print(show_output)
    
    net_connect.disconnect()
    print("\nConfiguration terminée avec succès!")
    
except Exception as e:
    print(f"Erreur: {str(e)}")
    print("\nConseil de dépannage: Vérifiez le fichier journal 'netmiko_session.log' pour plus de détails.")
    
    # Tentative de déconnexion propre en cas d'erreur
    try:
        if 'net_connect' in locals() and net_connect:
            net_connect.disconnect()
    except:
        pass
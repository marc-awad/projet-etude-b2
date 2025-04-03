import serial
import time
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
        'premiere_adresse': "192.168.0.1",
        'cidr': 24,
        'nombre_machines': 206
    },
    {
        'nom': "sous_réseau2",
        'adresse_reseau': "192.168.1.0",
        'masque': "255.255.255.224",
        'premiere_adresse': "192.168.1.1",
        'cidr': 27,
        'nombre_machines': 23
    },
    {
        'nom': "sous_réseau3",
        'adresse_reseau': "192.168.1.32",
        'masque': "255.255.255.240",
        'premiere_adresse': "192.168.1.33",
        'cidr': 28,
        'nombre_machines': 13
    },
    {
        'nom': "sous_réseau4",
        'adresse_reseau': "192.168.1.48",
        'masque': "255.255.255.248",
        'premiere_adresse': "192.168.1.49",
        'cidr': 29,
        'nombre_machines': 8
    },
]

# Configuration de la connexion série
print("=== Configuration de la connexion série au routeur Cisco ===")
port_com = input("Port COM à utiliser (ex: COM3): ")
baudrate = input("Débit en bauds (défaut: 9600): ") or "9600"

# Afficher les réseaux disponibles
print("\n=== Réseaux disponibles ===")
for i, network in enumerate(available_networks):
    print(f"{i+1}. {network['nom']} - Réseau: {network['adresse_reseau']}/{network['cidr']} - Machines: {network['nombre_machines']}")

# Configuration des interfaces pour chaque réseau souhaité
interfaces = []
print("\n=== Configuration des interfaces ===")
while True:
    try:
        choice = input("\nChoisissez un numéro de réseau (ou 'fin' pour terminer): ")
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
    print(f"\nOuverture du port série {port_com}...")
    ser = serial.Serial(port_com, int(baudrate), timeout=1)
    time.sleep(5) # Pause pour stabiliser la connexion

    def send_command(command, wait_time=3):
        print(f"Envoi: {command}")
        ser.write((command + '\r\n').encode())
        time.sleep(wait_time)
        response = ser.read(ser.inWaiting()).decode()
        # Afficher la réponse
        if response:
            print(f"Réponse: {response}")
        else:
            print("Aucune réponse reçue.")
        return response

    # Entrer en mode enable
    send_command("enable")
    password = input("Mot de passe enable (appuyer sur Entrée si aucun): ")
    if password:
        send_command(password)

    # Entrer en mode configuration
    send_command("configure terminal")

    # Configurer chaque interface
    for name, ip, mask in interfaces:
        print(f"\nConfiguration de l'interface {name}...")
        send_command(f"interface {name}")
        send_command(f"ip address {ip} {mask}")
        send_command("no shutdown")
        send_command("exit")

    # Sauvegarder la configuration et quitter
    send_command("end")
    send_command("write memory")

    print("\nFermeture de la connexion série...")
    ser.close()
    print("Configuration terminée avec succès!")

except Exception as e:
    print(f"Erreur: {e}")
    try:
        ser.close()
    except:
        pass

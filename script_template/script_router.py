from netmiko import ConnectHandler

# Paramètres de connexion au routeur Cisco
router = {
    "device_type": "cisco_ios",
    "ip": "192.168.1.1",  # Remplace par l'IP de ton routeur
    "username": "admin",
    "password": "password",
}

try:
    # Connexion SSH au routeur
    conn = ConnectHandler(**router)
    print("[✔] Connexion réussie au routeur.")

    # Lire les commandes depuis le fichier texte
    with open("config_vlsm.txt", "r") as file:
        commands = file.read().splitlines()

    # Envoyer les commandes au routeur
    print("[✔] Envoi de la configuration en cours...")
    output = conn.send_config_set(commands)
    print(output)

    # Sauvegarde de la configuration
    conn.save_config()
    print("[✔] Configuration sauvegardée avec succès.")

    # Déconnexion
    conn.disconnect()
    print("[✔] Déconnecté du routeur.")

except Exception as e:
    print(f"[❌] Erreur : {e}")

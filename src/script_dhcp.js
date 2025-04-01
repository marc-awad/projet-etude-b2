// Fonction pour générer le script PowerShell DHCP à partir des résultats
function genererScriptPowerShell(resultats) {
    if (!resultats || resultats.length === 0) {
        return "// Aucun résultat à traiter";
    }

    let script = `# Script PowerShell pour configurer un serveur DHCP avec les sous-réseaux calculés
# Exécuter ce script en tant qu'administrateur sur le serveur cible
# Généré automatiquement à partir des calculs de sous-réseaux

# Paramètres globaux
$DHCPServerIP = "192.168.100.10"  # À configurer selon votre environnement
$DefaultGateway = "192.168.100.1"  # À configurer selon votre environnement
$NetworkInterfaceAlias = "Ethernet"

# Fonction pour vérifier si l'exécution est en mode administrateur
function Test-Administrator {
    $user = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($user)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Vérification des privilèges d'administrateur
if (-not (Test-Administrator)) {
    Write-Host "Ce script nécessite des privilèges d'administrateur. Veuillez l'exécuter en tant qu'administrateur." -ForegroundColor Red
    exit
}

# Installation du rôle DHCP
Write-Host "Installation du rôle DHCP et des outils d'administration..." -ForegroundColor Cyan
try {
    Install-WindowsFeature DHCP -IncludeManagementTools -ErrorAction Stop
    Write-Host "Rôle DHCP installé avec succès." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de l'installation du rôle DHCP: $_" -ForegroundColor Red
    exit
}

# Configuration de l'adresse IP statique
Write-Host "Configuration de l'adresse IP statique ($DHCPServerIP)..." -ForegroundColor Cyan
try {
    # Vérifier si l'interface réseau existe
    $netAdapter = Get-NetAdapter | Where-Object { $_.Name -eq $NetworkInterfaceAlias }
    if (-not $netAdapter) {
        Write-Host "L'interface '$NetworkInterfaceAlias' n'existe pas. Interfaces disponibles:" -ForegroundColor Yellow
        Get-NetAdapter | Format-Table Name, InterfaceDescription
        $NetworkInterfaceAlias = Read-Host "Entrez le nom de l'interface réseau à utiliser"
    }
    
    # Configurer la nouvelle adresse IP
    New-NetIPAddress -IPAddress $DHCPServerIP -PrefixLength 24 -InterfaceAlias $NetworkInterfaceAlias -DefaultGateway $DefaultGateway -ErrorAction Stop -Confirm:$false
    
    Write-Host "Configuration IP réussie." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'adresse IP: $_" -ForegroundColor Red
    Write-Host "Poursuite du script..." -ForegroundColor Yellow
}

# Finalisation de l'installation du service DHCP
Write-Host "Finalisation de l'installation du service DHCP..." -ForegroundColor Cyan
try {
    # Création du répertoire pour les sauvegardes DHCP
    $DHCPBackupPath = "$env:SystemRoot\\System32\\dhcp\\backup"
    if (-not (Test-Path $DHCPBackupPath)) {
        New-Item -Path $DHCPBackupPath -ItemType Directory -Force
    }
    
    # Redémarrage du service DHCP
    Restart-Service DHCPServer -ErrorAction Stop
    
    Write-Host "Service DHCP configuré." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration du service DHCP: $_" -ForegroundColor Red
}

# Autorisation du serveur DHCP dans Active Directory (si AD est présent)
Write-Host "Vérification si Active Directory est présent..." -ForegroundColor Cyan
$isDomainController = (Get-WmiObject -Class Win32_ComputerSystem).DomainRole -ge 4
if ($isDomainController) {
    try {
        Write-Host "Autorisation du serveur DHCP dans Active Directory..." -ForegroundColor Cyan
        Add-DhcpServerInDC -ErrorAction Stop
        Write-Host "Serveur DHCP autorisé dans Active Directory." -ForegroundColor Green
    } catch {
        Write-Host "Erreur lors de l'autorisation du serveur DHCP dans AD: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Active Directory non détecté. Pas besoin d'autoriser le serveur DHCP." -ForegroundColor Yellow
}

# Configuration des étendues DHCP pour chaque sous-réseau
Write-Host "Configuration des étendues DHCP pour chaque sous-réseau..." -ForegroundColor Cyan\n\n`;

    // Création d'une étendue pour chaque sous-réseau valide
    resultats.forEach((resultat, index) => {
        if (!resultat.pasDeReseau) {
            const scopeName = resultat.nom.replace(/['"`]/g, ""); // Éviter les caractères problématiques
            const scopeId = resultat.adresseReseau.join('.');
            const startRange = resultat.premièreAdresse.join('.');
            const endRange = resultat.dernièreAdresse.join('.');
            const subnetMask = resultat.masque.join('.');
            
            script += `# Configuration pour le sous-réseau "${scopeName}"
$DHCPScopeID_${index} = "${scopeId}"
$DHCPScopeName_${index} = "${scopeName}"
$DHCPStartRange_${index} = "${startRange}"
$DHCPEndRange_${index} = "${endRange}"
$DHCPSubnetMask_${index} = "${subnetMask}"

try {
    # Vérifier si l'étendue existe déjà
    $existingScope = Get-DhcpServerv4Scope -ScopeId $DHCPScopeID_${index} -ErrorAction SilentlyContinue
    if ($existingScope) {
        Write-Host "L'étendue $DHCPScopeID_${index} existe déjà. Suppression..." -ForegroundColor Yellow
        Remove-DhcpServerv4Scope -ScopeId $DHCPScopeID_${index} -Force
    }
    
    # Création de l'étendue
    Add-DhcpServerv4Scope -Name $DHCPScopeName_${index} -StartRange $DHCPStartRange_${index} -EndRange $DHCPEndRange_${index} -SubnetMask $DHCPSubnetMask_${index} -State Active -ErrorAction Stop
    
    # Configuration des options DHCP (passerelle = premier octet du réseau + .1)
    $Gateway_${index} = ($DHCPScopeID_${index} -replace "\\d+$", "1")
    Set-DhcpServerv4OptionValue -ScopeId $DHCPScopeID_${index} -Router $Gateway_${index} -ErrorAction Stop
    
    Write-Host "Étendue DHCP $DHCPScopeName_${index} créée avec succès." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP $DHCPScopeName_${index}: $_" -ForegroundColor Red
}

`;
        }
    });

    script += `
# Redémarrage du service DHCP
Write-Host "Redémarrage du service DHCP..." -ForegroundColor Cyan
Restart-Service DHCPServer
Write-Host "Service DHCP redémarré." -ForegroundColor Green

# Affichage des informations de configuration
Write-Host "\\nRécapitulatif de la configuration du serveur DHCP:" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "Adresse IP du serveur : $DHCPServerIP" -ForegroundColor White
`;

    // Ajout des informations de récapitulation pour chaque étendue
    let compteurEtendues = 0;
    resultats.forEach((resultat, index) => {
        if (!resultat.pasDeReseau) {
            script += `Write-Host "Étendue ${compteurEtendues + 1}: $DHCPScopeName_${index} ($DHCPStartRange_${index} - $DHCPEndRange_${index})" -ForegroundColor White\n`;
            compteurEtendues++;
        }
    });

    script += `Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "\\nLa configuration du serveur DHCP est terminée." -ForegroundColor Green
Write-Host "Pour vérifier la configuration, ouvrez le gestionnaire DHCP (dhcpmgmt.msc)" -ForegroundColor Yellow`;

    return script;
}

// Fonction pour exporter le script PowerShell généré dans un fichier
function exporterScriptPowerShell(script, nomFichier = 'configurer_dhcp.ps1') {
    // Création d'un élément a pour le téléchargement
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(script));
    element.setAttribute('download', nomFichier);
    
    // Simulation du clic pour déclencher le téléchargement
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Fonction pour générer le bouton de téléchargement du script PowerShell
function creerBoutonExportPS() {
    // Vérifier si resultsArray existe et contient des données
    if (typeof resultsArray !== 'undefined' && resultsArray.length > 0) {
        // Créer un bouton pour exporter le script PowerShell
        const btnExportPS = document.createElement('button');
        btnExportPS.setAttribute('id', 'btnExportPS');
        btnExportPS.setAttribute('class', 'mainbutton');
        btnExportPS.textContent = 'Télécharger script PowerShell DHCP';
        
        // Ajout de l'événement au bouton
        btnExportPS.addEventListener('click', () => {
            const scriptPS = genererScriptPowerShell(resultsArray);
            exporterScriptPowerShell(scriptPS);
        });
        
        // Ajouter le bouton à la page
        document.getElementById('boxzone').appendChild(btnExportPS);
    }
}

// Fonction pour intégrer le générateur de script PowerShell
function integrerGenerateurPS() {
    // Observer les changements dans boxzone pour ajouter le bouton après les résultats
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Vérifier si un resultbox a été ajouté
                for (const node of mutation.addedNodes) {
                    if (node.id === 'resultbox') {
                        // Si le bouton n'existe pas déjà
                        if (!document.getElementById('btnExportPS')) {
                            // Attendre que tous les résultats soient ajoutés
                            setTimeout(creerBoutonExportPS, 500);
                        }
                    }
                }
            }
        }
    });
    
    // Observer les modifications dans boxzone
    const boxzone = document.getElementById('boxzone');
    if (boxzone) {
        observer.observe(boxzone, { childList: true });
    }
}

// Exécuter la fonction d'intégration après le chargement de la page
window.addEventListener('load', integrerGenerateurPS);
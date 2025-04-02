/**
 * Génère un script PowerShell pour configurer uniquement les étendues DHCP
 * @param {Array} subnetsArray - Tableau d'objets contenant les informations des sous-réseaux
 * @param {Object} configOptions - Options supplémentaires pour la configuration des étendues DHCP
 * @returns {string} - Le script PowerShell généré
 */
export function generateDhcpScript(subnetsArray, configOptions = {}) {
    // Valeurs par défaut
    const options = {
        defaultGateway: configOptions.defaultGateway || "192.168.100.1",
        scopeStartOffset: configOptions.scopeStartOffset || 10, // Décalage pour le début de plage
        scopeEndOffset: configOptions.scopeEndOffset || 5,      // Décalage pour la fin de plage
        includeDnsServer: configOptions.includeDnsServer || false,
        dnsServerIP: configOptions.dnsServerIP || "8.8.8.8"
    };

    // Filtrer les sous-réseaux valides (ceux qui n'ont pas de problème de manque d'adresses)
    const validSubnets = subnetsArray.filter(subnet => !subnet.pasDeReseau);

    if (validSubnets.length === 0) {
        return "# Aucun sous-réseau valide trouvé pour générer un script DHCP";
    }

    let powershellScript = `# Script PowerShell pour configurer uniquement les étendues DHCP
# Généré automatiquement le ${new Date().toLocaleString()}
# Assurez-vous d'exécuter ce script en tant qu'administrateur sur le serveur cible

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

# Paramètres de configuration
Write-Host "Configuration des étendues DHCP - Paramètres prédéfinis" -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor Cyan

$DefaultGateway = "${options.defaultGateway}"
${options.includeDnsServer ? `$DNSServer = "${options.dnsServerIP}"` : ''}

# Vérification que le service DHCP est disponible
# Installation du rôle DHCP et des outils d'administration
Write-Host "\nInstallation du rôle DHCP et des outils d'administration..." -ForegroundColor Cyan
try {
    Install-WindowsFeature DHCP -IncludeManagementTools -ErrorAction Stop
    Write-Host "Rôle DHCP installé avec succès." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de l'installation du rôle DHCP: $_" -ForegroundColor Red
    exit
}

try {
    $dhcpService = Get-Service DHCPServer -ErrorAction Stop
    if ($dhcpService.Status -ne "Running") {
        Write-Host "Le service DHCP n'est pas en cours d'exécution. Tentative de démarrage..." -ForegroundColor Yellow
        Start-Service DHCPServer -ErrorAction Stop
        Write-Host "Service DHCP démarré." -ForegroundColor Green
    } else {
        Write-Host "Service DHCP déjà en cours d'exécution." -ForegroundColor Green
    }
} catch {
    Write-Host "Erreur: Le service DHCP n'est pas installé ou ne peut pas être démarré." -ForegroundColor Red
    Write-Host "Veuillez installer le rôle DHCP avant d'exécuter ce script." -ForegroundColor Red
    exit
}

# Configuration des étendues DHCP
Write-Host "\\nConfiguration des étendues DHCP..." -ForegroundColor Cyan\n\n`;

    // Ajouter chaque étendue DHCP pour les sous-réseaux valides
    validSubnets.forEach((subnet, index) => {
        const scopeID = subnet.adresseReseau.join('.');
        const subnetMask = subnet.masque.join('.');
        const scopeName = subnet.nom;
        
        // Calculer les plages d'adresses (début et fin)
        let startRange = [...subnet.premièreAdresse];
        let endRange = [...subnet.dernièreAdresse];
        
        // Appliquer les décalages si possible
        if (parseInt(startRange[3]) + options.scopeStartOffset < parseInt(endRange[3]) - options.scopeEndOffset) {
            startRange[3] = parseInt(startRange[3]) + options.scopeStartOffset;
            endRange[3] = parseInt(endRange[3]) - options.scopeEndOffset;
        }
        
        powershellScript += `# Configuration de l'étendue ${index + 1}: ${scopeName}
try {
    # Vérifier si l'étendue existe déjà
    $existingScope = Get-DhcpServerv4Scope -ScopeId ${scopeID} -ErrorAction SilentlyContinue
    if ($existingScope) {
        Write-Host "L'étendue ${scopeID} existe déjà. Suppression..." -ForegroundColor Yellow
        Remove-DhcpServerv4Scope -ScopeId ${scopeID} -Force
    }
    
    # Création de l'étendue
    Add-DhcpServerv4Scope -Name "${scopeName}" -StartRange ${startRange.join('.')} -EndRange ${endRange.join('.')} -SubnetMask ${subnetMask} -State Active -ErrorAction Stop
    Write-Host "Étendue DHCP ${scopeName} créée avec succès." -ForegroundColor Green
    
    # Configuration des options DHCP
    Set-DhcpServerv4OptionValue -ScopeId ${scopeID} -Router $DefaultGateway`;
        
        // Ajouter les serveurs DNS si demandé
        if (options.includeDnsServer) {
            powershellScript += ` -DnsServer $DNSServer`;
        }
        
        powershellScript += ` -ErrorAction Stop
    Write-Host "Options DHCP pour ${scopeName} configurées." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors de la configuration de l'étendue DHCP ${scopeName}: $_" -ForegroundColor Red
}

`;
    });

    // Ajouter la fin du script
    powershellScript += `# Affichage des informations de configuration
Write-Host "\\nRécapitulatif des étendues DHCP:" -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "Passerelle par défaut : $DefaultGateway" -ForegroundColor White
${options.includeDnsServer ? 'Write-Host "Serveur DNS : $DNSServer" -ForegroundColor White' : ''}
Write-Host "Nombre d'étendues configurées : ${validSubnets.length}" -ForegroundColor White

# Liste des étendues configurées
Get-DhcpServerv4Scope | Format-Table -Property ScopeId, Name, SubnetMask, StartRange, EndRange, State -AutoSize

Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "\\nLa configuration des étendues DHCP est terminée." -ForegroundColor Green
shutdown /r /t 10
`;

    return powershellScript;
}


/**
 * Sauvegarde le script PowerShell généré dans un fichier
 * @param {string} script - Le script PowerShell généré
 * @param {string} filename - Nom du fichier de sortie (par défaut: dhcp-scopes.ps1)
 */
export function saveScriptToFile(script, filename = "dhcp-scopes.ps1") {
    try {
        // Dans un environnement de navigateur, créer un blob et proposer le téléchargement
        const blob = new Blob([script], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log(`Script sauvegardé sous ${filename}`);
        return true;
    } catch (error) {
        console.error("Erreur lors de la sauvegarde du script:", error);
        return false;
    }
}

/**
 * Génère un script PowerShell à partir des résultats du calculateur de sous-réseaux
 * @param {Array} resultsArray - Tableau des résultats du calculateur de sous-réseaux
 * @param {Object} options - Options supplémentaires pour la configuration
 * @param {boolean} saveToFile - Si true, sauvegarde le script dans un fichier
 * @param {string} filename - Nom du fichier de sortie (si saveToFile est true)
 * @returns {string} - Le script PowerShell généré
 */
export function generateDhcpScriptFromCalculator(resultsArray, options = {}, saveToFile = false, filename = "dhcp-scopes.ps1") {
    // Vérifier si resultsArray est valide
    if (!Array.isArray(resultsArray) || resultsArray.length === 0) {
        console.error("Erreur: résultats de sous-réseaux invalides ou vides");
        return "# Erreur: aucun résultat de sous-réseau valide fourni";
    }
    
    // Générer le script
    const script = generateDhcpScript(resultsArray, options);
    
    // Sauvegarder dans un fichier si demandé
    if (saveToFile) {
        saveScriptToFile(script, filename);
    }
    
    return script;
}

// Exporter les fonctions pour les rendre utilisables depuis d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateDhcpScript,
        generateDhcpScriptFromCalculator,
        saveScriptToFile
    };
}
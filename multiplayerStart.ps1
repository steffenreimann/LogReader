$GameDir = "E:\epicgames\SatisfactoryEarlyAccess"
$Username1 = "herbbert"
$Username2 = "TestPlayer"

$Args1 = "-EpicPortal", "-NoSteamClient", "-NoMultiplayer", '-Username="'+$Username1+'"'
$Args2 = "-EpicPortal", "-NoSteamClient", "-NoMultiplayer", '-Username="'+$Username2+'"'

function BGProcess(){
    Start-Process -NoNewWindow @args
}

BGProcess "$($GameDir)\FactoryGame\Binaries\Win64\FactoryGame-Win64-Shipping.exe" $Args1

sleep -m 5000

BGProcess "$($GameDir)\FactoryGame\Binaries\Win64\FactoryGame-Win64-Shipping.exe" $Args2
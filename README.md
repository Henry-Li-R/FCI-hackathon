# FCI-hackathon
​FCI Challenge (Track Sponsor): Smart Proposal Writing Assistant for Communities – Build an AI co-pilot for small municipalities to craft competitive funding proposals.


Fix ReadME later: 
Missing dependencies, go to: 
https://tauri.app/guides/prerequisites/#linux

Make sure you have installed the prerequisites for your OS: https://tauri.app/start/prerequisites/, then run:
  cd WillYouFundMe
  npm install
  npm run tauri android init

For Desktop development, run:
  npm run tauri dev

# install nvm if you don’t have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc

# install and use a modern Node version
nvm install 22
nvm use 22

# backend
python3 -m venv venv
source venv/bin/activate

pip install fastapi uvicorn requests

# to run backend
uvicorn backend.app:app --host 127.0.0.1 --port 8000

# in order to run tauri-cli for rust (linux): 
cargo install tauri-cli

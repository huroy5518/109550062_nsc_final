import asyncio
import argparse
import json
from websockets.sync.client import connect
from aiortc import (
    MediaStreamTrack,
    RTCDataChannel,
    RTCPeerConnection,
    RTCSessionDescription,
    VideoStreamTrack,
    RTCConfiguration,
    RTCIceServer,
    RTCIceCandidate,
    RTCDataChannelParameters
)
from aiortc.contrib.signaling import create_signaling, add_signaling_arguments
import os


# config = RTCConfiguration([RTCIceServer(urls='stun:stun.l.google.com:19302'), RTCIceServer(urls='turn:140.113.67.69:34780', username='demo', credential='demo')])
# iceserver_list = [RTCIceServer(urls='stun:stun.l.google.com:19302'), RTCIceServer(urls='turn:192.168.2.220:3478', username='demo', credential='demo')]
iceserver_list = []
# config = RTCConfiguration([])


async def start():

    file = args.file
    file_data = ''
    tracker = args.tracker
    if not os.path.exists(file):
        print("File not exists")
        exit(0)
    with open(file, 'r') as f:
        file_data = f.read()
    # obj = {'type': 'REQUEST_SERVER', 'role': 'server', 'file': [file], 'offer': pc.localDescription.sdp}
    obj = {'type': 'REQUEST_SERVER', 'role': 'server', 'file': [file]}
    print("[*]Connect to Tracker Server")
    clients = dict()
    # with connect('ws://localhost:3000') as websocket:
    with connect('ws://'+tracker) as websocket:
        websocket.send(json.dumps(obj))
        # websocket.send("\{\}")
        while True:
            try:
                data = websocket.recv()
                # print(data)
                data = json.loads(data)
                print(data)
            except KeyboardInterrupt:
                return
            except:
                continue
            if data['type'] == 'RESPONSE_URL':
                print(f"[*]File Share ID = {data['file_id']}")
                print(f"[*]Wait For Client")
            elif data['type'] == 'REQUEST_CLIENT_OFFER':
                # print(f"[*]Receive Client's SDP")
                # print(data)
                # print(data['offer'])
                if data['src'] not in clients:
                    clients[data['src']] = {'pc': RTCPeerConnection(configuration=config)}
                    pc = clients[data['src']]['pc']
                    # pc.on("datachannel", lambda x: print("On datachannel"))
                    @pc.on("datachannel")
                    async def on_datachannel(channel):
                        print("Sending out file")
                        channel.send(file_data)
                        channel.close()
                    # clients[data['src']]['channel'] = pc.createDataChannel('file')
                else:
                    pc = clients[data['src']]['pc']
                description = RTCSessionDescription(sdp=data['offer']['sdp'], type=data['offer']['type'])
                # await pc.setRemoteDescription(data['offer'])
                await pc.setRemoteDescription(description)
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                res = {}
                res['type'] = 'RESPONSE_SERVER_ANSWER'
                res['conn'] = data['src']
                res['src'] = data['conn']
                res['answer'] = pc.localDescription.sdp
                websocket.send(json.dumps(res))
            elif data['type'] == 'REQUEST_CLIENT_ICE_CAND':
                # print("In request client ice cand")
                if data['src'] not in clients:
                    continue
                pc = clients[data['src']]['pc']
                description = RTCSessionDescription(sdp=data['offer']['sdp'], type=data['offer']['type'])
                await pc.setRemoteDescription(description)
                print("after add ")
                


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Data channels ping/pong")
    # parser.add_argument("role", choices=["offer", "answer"])
    parser.add_argument("--file", "-f", required=True, help="file name")
    parser.add_argument("--tracker", '-t', required=True, help="tracker server address")
    parser.add_argument("--stunserver", '-s', required=False, help='stun server address')
    parser.add_argument("--turnserver", '-ts', required=False, help="turn server address")
    parser.add_argument("--username", "-u", required=False, help="turn server username")
    parser.add_argument("--password", "-p", required=False, help="turn server password")
    args = parser.parse_args()
    
    if args.stunserver is not None:
        if args.stunserver[:5] != "stun:":
            print("Given Server is not stun server")
            exit(0)
        iceserver_list.append(RTCIceServer(urls=args.stunserver))

    if args.turnserver is not None:
        if args.username is None:
            print("Please set username when you want to use turn server")
            exit(0)
        if args.password is None:
            print("Please set password when you want to use turn server")
            exit(0)
        if args.turnserver[:5] != "turn:":
            print("Given Server is not turn server")
            exit(0)
        
        iceserver_list.append(RTCIceServer(urls=args.turnserver, username=args.username, credential=args.password))

    config = RTCConfiguration(iceserver_list)
    # add_signaling_arguments(parser)
    # args = parser.parse_args()
    # signaling = create_signaling(args)

    asyncio.run(start())
    

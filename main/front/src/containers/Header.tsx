import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { assign, login } from "../store/reducer"
import { Link } from "react-router-dom";
import axios from "axios";
import forge from "node-forge"

const Header = () => {
  const [nodes, setNodes] = useState([]);
  const [username, setUsername] = useState("");
  let logout: boolean = useSelector((state: any) => state.store).logout;
  const dispatch = useDispatch();

  useEffect(() => {
    axios.get("yourhost/send-nodes"
    ).then((resp) => {
      const nodesModel = resp.data;
      let nodes: {uri: string, x: number, y: number}[] = [];
      nodesModel.forEach((nodeModel) => {
        const node: {uri: string, x: number, y: number} = {uri: nodeModel.pk, x:nodeModel.fields.x, y: nodeModel.fields.y}
        nodes.push(node);
      });
      setNodes(nodes);
      dispatch(assign(nodes));

      //if user gives location, then sort nodes by distance.
      navigator.geolocation.getCurrentPosition((pos) => {
        const sortedNodes: object[] = sortNodes(nodes, pos.coords.longitude, pos.coords.latitude);
        setNodes(sortedNodes);
        dispatch(assign(sortedNodes));
      });
    }).catch((error: any) => {
      console.log(error.message + "\nCause = " + error.response.data);
    });
  }, []);
  
  useEffect(() => {
    if(logout){
      (Array.from(document.getElementsByClassName('btn-show-login') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
      (Array.from(document.getElementsByClassName('btn-show-create') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block"; 
      dispatch(login(false));
    }else if(localStorage.getItem("username")){
      (Array.from(document.getElementsByClassName('btn-show-login') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
      (Array.from(document.getElementsByClassName('btn-show-create') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none"; 
    }
  }, [logout]);

  const handleShowCreate = () => {
    (Array.from(document.getElementsByClassName('create-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
    (Array.from(document.getElementsByClassName('login-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
  }

  const handleShowLogin = () => {
    (Array.from(document.getElementsByClassName('login-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
    (Array.from(document.getElementsByClassName('create-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
  }

  const handleUsername = e => {
    setUsername(e.target.value);
  };

  const handleLogin = () => {
    const nodesTotal = nodes.length
    if(nodesTotal){
      axios.post("yourhost/get-wallet-key",{
        username: username
      })
      .then((respond) => {
        if(respond.data.status){
          let i = 0;
          const loginReqs = () => {
            axios.post(nodes[i].uri+"/wallet-login",{
              key: respond.data.key
            })
            .then((resp) => {
              if(resp.data.status){
                alert("Logged in successfully.");
                localStorage.setItem('username', username);
                localStorage.setItem('amount', resp.data.amount);
                (Array.from(document.getElementsByClassName('btn-show-login') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
                (Array.from(document.getElementsByClassName('btn-show-create') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
                (Array.from(document.getElementsByClassName('login-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
                dispatch(login(true));
              }
              else{
                //if the node didn't registered this wallet successfully or something went wrong, then try next node.
                i++;
                if(i<nodesTotal)
                  loginReqs();
                else
                  alert("There are no responding nodes.")
              }
            })
            .catch(() => {
              //if node didn't respond anything or something went wrong, then try next node.
              i++;
              if(i<nodesTotal)
                loginReqs();
              else
                alert("There are no responding nodes.")
            });
          }
          loginReqs();
        }          
        else
          alert("Wallet is not exist.")
      })
      .catch((error: any) => {
        console.log(error.message + "\nCause = " + error.response.data);
      });
    }
    else
      alert("There is no connected node. Please refresh the page.")
  }
 
  const handleCreateWallet = () => {
    const nodesTotal = nodes.length
    if(nodesTotal){
      var pki = forge.pki;
      var rsa = forge.pki.rsa;
      var keypair = rsa.generateKeyPair({bits: 1024});
      var pubKeyPEM = (pki.publicKeyToPem(keypair.publicKey)).replaceAll("\r\n", "  ").trim();
      var privKeyPEM = (pki.privateKeyToPem(keypair.privateKey)).replaceAll("\r\n", "  ").trim();

      axios.post("yourhost/new-wallet",{
        username: username,
        key: privKeyPEM
      })
      .then((resp) => {
        if(resp.data.status){
          let i = 0;
          const createWalletReqs = () => {
            axios.post(nodes[i].uri+"/new-wallet",{
              key: privKeyPEM
            })
            .then(() => {
              alert("Your username = "+username +"\nYour secret key = "+pubKeyPEM);
              (Array.from(document.getElementsByClassName('create-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
            })
            .catch(() => {
              //if node didn't respond anything or something went wrong, then try next node.
              i++;
              if(i<nodesTotal)
                createWalletReqs();
              else
                alert("There are no responding nodes.")
            });
          }
          createWalletReqs();
        }
        else
          alert(resp.data.message)//username has been taken.
      }).
      catch((error: any) => {
        console.log(error.message + "\nCause = " + error.response.data);
      });
    }
    else
      alert("There is no connected node. Please refresh the page.")
  }

  const sortNodes = (nodes: object[], x: number, y: number) => {
    let items: object[] = [];
    nodes.forEach((node) => {
      items.push(node);
    });

    return quickSort(items, 0, items.length-1, x, y);
  }

  function swap(items, leftIndex, rightIndex){
    let temp = items[leftIndex];
    items[leftIndex] = items[rightIndex];
    items[rightIndex] = temp;
  }

  function partition(items, left, right, x, y) {
    let pivot = items[Math.floor((right + left) / 2)]; //middle element
    let pivotDistance = (Math.pow(pivot.x-x, 2) + Math.pow(pivot.y-y, 2));
    let  i = left; //left pointer
    let  j = right; //right pointer
    while (i <= j) {
        while ((Math.pow(items[i].x-x, 2) + Math.pow(items[i].y-y, 2))  < pivotDistance) {
            i++;
        }
        while ((Math.pow(items[j].x-x, 2) + Math.pow(items[j].y-y, 2))  > pivotDistance) {
            j--;
        }
        if (i <= j) {
            swap(items, i, j); //sawpping two elements
            i++;
            j--;
        }
    }
    return i;
  }

  function quickSort(items, left, right, x, y) {
    let index;
    if (items.length > 1) {
        index = partition(items, left, right, x, y); //index returned from partition
        if (left < index - 1) { //more elements on the left side of the pivot
            quickSort(items, left, index - 1, x, y);
        }
        if (index < right) { //more elements on the right side of the pivot
            quickSort(items, index, right, x, y);
        }
    }
    return items;
  }

  return (
    <div className="ui fixed menu">
      <div className="ui container center navbar">
        <Link to={`/`}>
          <h2>Shila</h2>
        </Link>

        <button onClick={handleShowLogin} className="btn btn-show-login">
          Login With Wallet
        </button>

        <button onClick={handleShowCreate} className="btn btn-show-create">
          Create New Wallet
        </button>
        
        <div className="create-wallet">
          <input className="input input-username"
            type="text"
            placeholder="username"
            value={username}
            onChange={handleUsername}
          /> &nbsp; &nbsp;
          <button onClick={handleCreateWallet} className="btn btn-create-wallet">
            Create
          </button>
        </div>

        <div className="login-wallet">
          <input className="input input-username"
            type="text"
            placeholder="username"
            value={username}
            onChange={handleUsername}
          /> &nbsp; &nbsp;
          <button onClick={handleLogin} className="btn btn-login">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

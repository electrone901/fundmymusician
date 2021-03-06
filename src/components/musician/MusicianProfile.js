import React, { useState, useEffect } from 'react';
import { useParams } from "react-router";
import axios from 'axios';
import moment from 'moment';

import { firebaseURL } from '../../firebaseUrl';
import { loadWeb3, loadBlockchainData, fmmBlockchain } from '../../blockchain';
import TransferTokenModal from './TransferTokenModal';
import AddMusicModal from './AddMusicModal';
import Alert from '../common/Alert';

const MusicianProfile = () => {
    const { id } =  useParams();

    const [walletAddress, setWalletAddress] = useState('');
    const [balance, setBalance] = useState(0)
    const [amount, setAmount] = useState(0);
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState(false);

    const [musician, setMusician] = useState({});

    useEffect(() => {
        async function load(){
            await loadWeb3();
        }

        async function getWalletAddress(){
            try{
                await loadBlockchainData();
                const web3 = window.web3;
                const accounts = await web3.eth.getAccounts();
                setWalletAddress(accounts[0]);

                const balanceOf = await fmmBlockchain.methods.balanceOf(accounts[0]).call();
                setBalance(balanceOf);
            }
            catch(err){
                console.error(err);
                setError("Non-Ethereum browser detected. You should consider trying MetaMask!")
            }
            
        }

        async function getMusician(){
            try{
                const { data } = await axios.get(firebaseURL + '/musicians/' + id + '.json');

                setMusician(data);
                console.log(data)
                getTransactionsHistory(data.walletAddress);
            } catch(err){
                console.error(err);
            }
        }

        async function getTransactionsHistory(musicianWalletAddress){
            try{
                await loadBlockchainData();

                const transactions = await fmmBlockchain.getPastEvents('Transfer', { fromBlock: 0, toBlock: 'latest', filter: { to: musicianWalletAddress }});
                console.log(transactions);
                setTransactions(transactions);
            } catch(err){
                console.error(err);
            }
        }

        load();
        getWalletAddress();
        getMusician();

        window.scrollTo(0, 0);
    }, [id]);

    const addLike = async musician => {
        try{
            setLoading(true);
            const receipt = await fmmBlockchain.methods.likesMusician().send({ from: walletAddress });

            if(receipt.status){
                musician.likes += 1;
            
                const { data } = await axios.put(firebaseURL + '/musicians/' + id + '.json', musician);
                setMusician(data);
            }

            setLoading(false);
        } catch(err){
            console.error(err);
            setLoading(false);
        }
    }

    const transferToken = async() => {
        try{
            setLoading(true);
            await fmmBlockchain.methods.transfer(musician.walletAddress, amount).send({ from: walletAddress });
            
            setBalance(+balance - +amount);
            setAmount(0);
            setLoading(false);
        }
        catch(err){
            console.error(err);
            setLoading(false);
        }
    }
    
    return(
        <div className="container">
            <Alert msg={error}/>
            <div className="row my-5">
                <div className="col-12 col-md-4">
                    <div className="card mb-3">
                        <div className="card-body">
                            <img className="img-fluid" src={musician.imageUrl} alt="Person" />
                            <h3 className="card-title text-center">{musician.name}</h3>
                            <p className="card-text text-center">
                                {musician.likes} Likes <button className="btn btn-secondary" onClick={() => addLike(musician)} disabled={loading}>{loading ? 'Pending' : '1 FMM to Like'}</button>
                            </p>
                            <button className="btn btn-primary btn-lg d-block m-auto" data-toggle="modal" data-target="#transferTokenModal">
                                Give Token
                            </button>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h3 className="card-title">Tags</h3>
                            <p className="card-text"><span className="badge badge-pill btn-secondary">{musician.tags}</span></p>
                        </div>
                    </div>
                    <div className="card my-3">
                        <div className="card-body">
                            <h3 className="card-title">Wallet Address</h3>
                            <p className="card-text">{musician.walletAddress}</p>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-8">
                    <div className="card mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between mb-3">
                                <h3 className="card-title">Videos</h3>
                                <button className="btn btn-primary" data-toggle="modal" data-target="#addMusicModal">
                                    Add Video
                                </button>
                            </div>

                            <div className="row">
                                <div className="col-12 col-md-6 mb-3">
                                    <iframe
                                        className="video"
                                        src='https://www.youtube.com/embed/RldMvYpKPbM'
                                        frameBorder='0'
                                        allow='autoplay; encrypted-media'
                                        allowFullScreen
                                        title='video' />
                                </div>
                                <div className="col-12 col-md-6 mb-3">
                                    <iframe
                                        className="video"
                                        src='https://www.youtube.com/embed/RldMvYpKPbM'
                                        frameBorder='0'
                                        allow='autoplay; encrypted-media'
                                        allowFullScreen
                                        title='video' />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-3">
                        <div className="card-body">
                            <h3 className="card-title">Donation History</h3>

                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th scope="col">From</th>
                                            <th scope="col">Amount</th>
                                            <th scope="col">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        { transactions.map((transaction, key) => {
                                            return (
                                                <tr key={key}>
                                                    <td>{transaction.returnValues.from}</td>
                                                    <td>{transaction.returnValues.value}</td>
                                                    <td>{moment.unix(transaction.returnValues.date).format('M/D/Y')}</td>
                                                </tr>
                                            )
                                        }) }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <TransferTokenModal
                musicianAddress={musician.walletAddress}
                walletAddress={walletAddress}
                balance={balance}
                amount={amount}
                setAmount={setAmount}
                transferToken={transferToken}
                loading={loading} />
            <AddMusicModal
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl} />
        </div>
    );
};

export default MusicianProfile;
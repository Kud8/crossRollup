import React, { Component } from 'react';
import Web3 from 'web3';
import Modal from 'react-modal';
import Amount from 'arui-feather/amount';
import Button from 'arui-feather/button';
import IconButton from 'arui-feather/icon-button';
import Input from 'arui-feather/input';

import { CONTRACT_ADDRESS, BALANCE_MINORITY } from '../constants/app';
import CONTRACT_ABI from '../constants/abi';

import './App.css';

const web3 = new Web3(Web3.givenProvider);

const customStyles = {
    content : {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        padding: '40px'
    },
    overlay: {
        background: 'rgba(0,0,0,0.85)'
    }
};

class App extends Component {
    state = {
        balance: 0,
        contract: new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS),
        currentAccount: undefined,
        error: undefined,
        inputMoney: 0,
        inputAddress: undefined,
        isBalanceLoading: false,
        isBalanceModalShow: false,
        owner: undefined,
    };

    async componentDidMount() {
        const { contract } = this.state;

        window.ethereum.enable();

        Modal.setAppElement('#app');

        try {
            const owner = (await contract.methods.owner().call()).toLowerCase();
            const balance = await contract.methods.balance().call();
            const currentAccount = web3.eth.accounts.currentProvider.selectedAddress.toLowerCase();

            setInterval(() => {
                const { currentAccount } = this.state;
                const newAccount = web3.eth.accounts.currentProvider.selectedAddress.toLowerCase();
                if (newAccount !== currentAccount) {
                    this.setState({ currentAccount: newAccount });
                }
            }, 500);

            this.setState(
                { owner, balance, currentAccount },
                () => console.log(this.state)
            );
        } catch (error) {
            this.setState({ error })
        }

    }

    handleDeposit = async () => {
        const { contract, currentAccount, inputMoney } = this.state;

        this.setState({ isBalanceLoading: true });

        try {
            await contract.methods.deposit().send({
                from: currentAccount,
                value: web3.utils.toWei(inputMoney, 'ether')
            });
            const balance = await contract.methods.balance().call();

            this.setState({ isBalanceLoading: false, isBalanceModalShow: false, balance });
        } catch (e) {
            this.setState({ isBalanceLoading: false, isBalanceModalShow: false });
        }
    };

    handleRequestExchange = async () => {
        const { contract, inputAddress, currentAccount } = this.state;
        await contract.methods.requestExchange(inputAddress).send({ from: currentAccount });
        alert(`Exchange requested from ${currentAccount} to ${inputAddress}`);
    }

    handleCompleteExchange = async () => {
        const { contract, inputAddress, currentAccount } = this.state;
        await contract.methods.completeExchange(inputAddress).send({ from: currentAccount });
        alert(`Exchange completed from ${currentAccount} to ${inputAddress}`);
    }

    openBalanceModal = () => this.setState({ isBalanceModalShow: true });
    closeBalanceModal = () => this.setState({ isBalanceModalShow: false });

    handleChangeMoneyInput = (inputMoney) => this.setState({ inputMoney });
    handleChangeAddressInput = (inputAddress) => this.setState({ inputAddress });

    render() {
        const {
            error, owner, balance, isBalanceLoading, isBalanceModalShow, currentAccount, inputMoney
        } = this.state;

        if (error) {
            return (
                <div className='app app__error'>
                    <h1>
                        Контракт не действителен.<br/>
                        Создайте новый и обновите приложение.
                    </h1>
                    <img src='https://cdn.oubly.net/img/the_dev_dog.gif' />
                </div>
            )
        }

        const ethBalance = balance && window.web3.fromWei(balance, 'ether');

        return (
            <div className='app' id='app'>
                <div className='app__info'>
                    <div className='app__info__table'>
                        <table>
                            <tbody>
                                <tr>
                                    <td className='app__info__table__key'>Создатель контракта:</td>
                                    <td className='app__info__table__value'>{ owner }</td>
                                </tr>
                                <tr>
                                    <td>
                                        <div>
                                            <Input
                                                className='app__modal__input'
                                                clear={ true }
                                                onChange={ this.handleChangeAddressInput }
                                                label='Введите адрес'
                                            />
                                            <IconButton onClick={ this.handleRequestExchange}>
                                                Запросить транзакцию
                                            </IconButton>
                                            {
                                                currentAccount === owner && (
                                                    <IconButton onClick={ this.handleCompleteExchange}>
                                                        Завершить транзакцию
                                                    </IconButton>
                                                )
                                            }
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className='app__account'>
                    <img className='app__account__image' src='https://pngimage.net/wp-content/uploads/2018/05/default-avatar-png-9.png' />
                    {
                        currentAccount && (
                            <div className='app__account__currentAccount'>
                                <span>Текущий аккаунт: </span>
                                <span className='app__account__currentAccount--address'>{currentAccount}</span>
                            </div>
                        )
                    }
                    <div className='app__info__balance'>
                        <div className='app__info__balance__amount'>
                            <div>Баланс: </div>
                            <Amount
                                size='xl'
                                bold={ true }
                                theme='alfa-on-color'
                                amount={{
                                    value: ethBalance * BALANCE_MINORITY || 0,
                                    currency: {
                                        code: 'ETH',
                                        minority: BALANCE_MINORITY
                                    }
                                }}
                            />
                        </div>
                        <div className='app__info__balance__button'>
                            <Button
                                size='m'
                                view='extra'
                                width='available'
                                disabled={ isBalanceLoading }
                                onClick={ this.openBalanceModal }
                            >
                                { isBalanceLoading ? 'Идет оплата...' : 'Пополнить' }
                            </Button>
                        </div>
                    </div>
                </div>

                <Modal
                    isOpen={ isBalanceModalShow }
                    style={ customStyles }
                    onRequestClose={ this.closeBalanceModal }
                >
                    <div>
                        <Input
                            className='app__modal__input'
                            clear={ true }
                            onChange={ this.handleChangeMoneyInput }
                            label='Введите сумму в ETH'
                        />
                        <Button
                            className='app__modal__button'
                            size='m'
                            view='extra'
                            width='available'
                            disabled={ isBalanceLoading || !inputMoney }
                            onClick={ this.handleDeposit }
                        >
                            { isBalanceLoading ? 'Идет оплата...' : 'Внести деньги' }
                        </Button>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default App;

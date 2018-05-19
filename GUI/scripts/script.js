function move(amount)
{
	$("#slider ul").animate({
		left: amount
	}, 500);
	
	var items = document.getElementsByClassName('dot');
  	for (var i=0; i < items.length; i++) {
		items[i].style.color = "#fff";
		items[parseFloat(amount)/-100].style.color = "#28a745";
  	}
}

function copyCode1()
{
    var clipboard = new ClipboardJS('.copy', {
        text: function() {
			return "npm install -g ganache-cli && ganache-cli --account=\"0xc95c22f47bc432aeb39b6437316dd97994c14c4694f911f0ccf75e45a2c0a42f, 25002500000000000000\" --account=\"0xad744ebab10251f4d939f799169c2b12ae5f1266c64262c5049e5cb945604c64, 2400000000000000\" --account=\"0x310f65813e288156ad816acea4b447e395d1eea19af27962a14359f455b77e8f, 2400000000000000\" --account=\"0xfc4991aed35e835ba966205f8f0479c5fa61574411ab7c9a7ce3165e2a89889c, 2400000000000000\" -g 1 -l 1000000000000000"}
    });

	document.getElementsByClassName('copied')[0].style.display = "inline";
	document.getElementsByClassName('uncopied')[0].style.display = "none";
}

function copyCode2()
{
    var clipboard = new ClipboardJS('.copy', {
        text: function() {
			return "pragma solidity ^0.4.0; contract StudentFinance{ uint private contractdate; address private financier; mapping (address => uint) private debts; address[] private activestudents; mapping (address => Student) private studentrecords; bytes32[] private activeloantypes; mapping (bytes32 => LoanType) private loantypes; RepaymentType[] private repaymenttypes; bytes32[] private loancategories; address[] private defaulters; mapping (uint => uint) private interests; struct Student { uint startdate; uint income; uint incomeparents; bool studying; bytes32[] loans; mapping (bytes32 => LoanLog) loanlogs; bytes32 repaymenttype; uint repaymentstartdate; uint topaythismonth; } struct LoanLog { uint monthlycreditleft; uint expirydate; } struct LoanType { uint maxamount; uint maxduration; uint maxincome; uint maxincomeparents; bytes32 repaymenttype; } struct RepaymentType { bytes32 name; uint maxyears; uint maxpercentageincome; } constructor() public { contractdate = block.timestamp; financier = msg.sender; } function GetAddress() public view returns (address) { return msg.sender; } function GetAddressFinancier() private view returns (address) { return financier; } function GetAddressContract() public view returns (address) { return this; } function GetBalance() public view returns (uint) { return WeiToEur(msg.sender.balance); } function GetBalanceContract() public view returns (uint) { RequireIsFinancier; return WeiToEur(address(this).balance); } function GetDate() public view returns (uint y, uint m, uint d) { uint date = 0; if(msg.sender == financier) { date = contractdate; } else { date = studentrecords[msg.sender].startdate; require(date != 0); } return (getYear(date), getMonth(date), getDay(date)); } function GetDateContract() public view returns (uint y, uint m, uint d) { return (getYear(contractdate), getMonth(contractdate), getDay(contractdate)); } function Deposit() payable public { RequireIsFinancier(); } function Withdraw(uint amount) public { RequireIsFinancier(); require(address(this).balance >= amount); msg.sender.transfer(amount); } function GetDebt() public view returns (uint) { RequireIsStudent(); return (debts[msg.sender]); } function PayDebt(address student) payable public { uint amounteuro = WeiToEur(msg.value); require(debts[student] >= amounteuro); debts[student] -= amounteuro; studentrecords[student].topaythismonth < amounteuro ? studentrecords[student].topaythismonth = 0 : studentrecords[student].topaythismonth -= amounteuro; } function AcceptLoan(bytes32 loantype) public { RequireIsStudent(); require(!AlreadyHasLoan(loantype)); require(IsEligibleFor(loantype)); if(!IsActiveStudent()) { activestudents.push(msg.sender); } InitializeLoanLog(loantype); } function Loan(bytes32 loantype, uint amounteuro) public { RequireIsStudent(); require(amounteuro > 0); require(IsEligibleFor(loantype)); require(AlreadyHasLoan(loantype)); require(studentrecords[msg.sender].loanlogs[loantype].monthlycreditleft >= amounteuro); uint amountwei = EurToWei(amounteuro); require(address(this).balance >= amountwei); msg.sender.transfer(amountwei); studentrecords[msg.sender].loanlogs[loantype].monthlycreditleft -= amounteuro; debts[msg.sender] += amounteuro; } function InitializeLoanLog(bytes32 loantype) private { RequireIsStudent(); studentrecords[msg.sender].loanlogs[loantype] = LoanLog(loantypes[loantype].maxamount, CalculateExpiryDate(loantype)); studentrecords[msg.sender].loans.push(loantype); studentrecords[msg.sender].repaymenttype = loantypes[loantype].repaymenttype; } function CreateLoanType(bytes32 name, uint maxamounteuro, uint maxdurationyears, uint maxincome, uint maxincomeparents, bytes32 repaymenttype) public { RequireIsFinancier(); require(!IsLoanType(name)); require(IsRepaymentType(repaymenttype)); require(maxamounteuro > 0); require(maxdurationyears >= 1); loantypes[name] = LoanType(maxamounteuro, maxdurationyears * 12, maxincome, maxincomeparents, repaymenttype); } function IsLoanType (bytes32 loan) private view returns (bool) { RequireIsFinancier(); return loantypes[loan].maxduration != 0; } function ActivateLoanType(bytes32 name) public { RequireIsFinancier(); require(IsLoanType(name)); require(!IsActiveLoanType(name)); activeloantypes.push(name); } function DeactivateLoanType(bytes32 name) public { RequireIsFinancier(); for(uint i = 0; i < activeloantypes.length; i++) { if(activeloantypes[i] == name) { delete activeloantypes[i]; break; } } } function IsActiveLoanType(bytes32 s) private view returns (bool) { for(uint i = 0; i < activeloantypes.length; i++) { if(activeloantypes[i] == s) { return true; } } return false; } function CreateRepaymentType(bytes32 name, uint maxyears, uint maxpercentageincome) public { RequireIsFinancier; require(!IsRepaymentType(name)); require(maxyears >= 1); require(maxpercentageincome > 0); repaymenttypes.push(RepaymentType(name, maxyears, maxpercentageincome)); } function IsRepaymentType(bytes32 name) private view returns (bool) { for (uint i = 0; i < repaymenttypes.length; i++ ) { if(repaymenttypes[i].name == name) { return true; } } return false; } function GetRepaymentType(bytes32 name) public view returns (uint y, uint p) { require(IsRepaymentType(name)); for (uint i = 0; i < repaymenttypes.length; i++ ) { if(repaymenttypes[i].name == name) { return (repaymenttypes[i].maxyears, repaymenttypes[i].maxpercentageincome); } } } function IsEligibleFor(bytes32 loan) public view returns (bool) { return (studentrecords[msg.sender].repaymentstartdate == 0 && studentrecords[msg.sender].studying == true && studentrecords[msg.sender].income <= loantypes[loan].maxincome && studentrecords[msg.sender].incomeparents <= loantypes[loan].maxincomeparents && IsActiveLoanType(loan) || (AlreadyHasLoan(loan) && studentrecords[msg.sender].loanlogs[loan].expirydate >= block.timestamp)); } function AlreadyHasLoan(bytes32 loan) public view returns (bool) { RequireIsStudent(); return studentrecords[msg.sender].loanlogs[loan].expirydate != 0; } function AddYearInterest(uint year, uint interest) public { RequireIsFinancier(); require(getYear(block.timestamp) < year || activestudents.length == 0); interests[year] = interest; } function GetYearInterest(uint year) public view returns (uint) { return interests[year]; } function GetInformation() public view returns (uint i, uint ip, bool s) { RequireIsStudent; return(studentrecords[msg.sender].income, studentrecords[msg.sender].incomeparents, studentrecords[msg.sender].studying); } function IsActiveStudent() private view returns (bool) { RequireIsStudent(); for (uint i = 0; i < activestudents.length; i++ ) { if(activestudents[i] == msg.sender) { return true; } } return false; } function GetNumberActiveStudents() public view returns (uint) { return activestudents.length; } function InitializeStudentRecord(uint income, uint incomeparents) public { RequireIsStudent(); studentrecords[msg.sender] = Student(block.timestamp, income, incomeparents, true, new bytes32[](0), "/", 0, 0); } function UpdateStudentRecord(uint income, uint incomeparents, bool studying) public { RequireIsStudent(); studentrecords[msg.sender].income = income; studentrecords[msg.sender].incomeparents = incomeparents; if(studying) { studentrecords[msg.sender].studying = true; studentrecords[msg.sender].repaymentstartdate = 0; } else { studentrecords[msg.sender].studying = false; studentrecords[msg.sender].repaymentstartdate = toTimestamp(getYear(block.timestamp) + 1, 1, 1); } } function MonthlyUpdate() private { RequireIsFinancier(); delete defaulters; for (uint i = activestudents.length - 1; i >= 0; i--) { address student = activestudents[i]; uint y; uint p; (y, p) = GetRepaymentType(studentrecords[student].repaymenttype); if(studentrecords[student].repaymentstartdate != 0 && debts[student] == 0 || GetDifferenceInMonths(studentrecords[student].repaymentstartdate, getMonth(block.timestamp)) > (y * 12)) { delete activestudents[i]; } else if(studentrecords[student].repaymentstartdate != 0) { if(studentrecords[student].topaythismonth > 0) { defaulters.push(student); } uint term = (getYear(block.timestamp) - getYear(studentrecords[student].repaymentstartdate)) / 5; debts[student] += debts[student] * (100 + interests[getYear(studentrecords[student].repaymentstartdate) + term * 5] / 12) / 100; studentrecords[student].topaythismonth = studentrecords[student].topaythismonth + CalculateMonthlyRepayAmount(student); } else { debts[student] += debts[student] * (100 + interests[getYear(block.timestamp)] / 12) / 100; ResetMonthlyLoanCredit(student); } } } function CalculateMonthlyRepayAmount(address student) public view returns (uint) { require(msg.sender == financier || msg.sender == student); if(studentrecords[student].repaymentstartdate == 0) { return 0; } uint repaymentmonth = GetDifferenceInMonths(studentrecords[student].repaymentstartdate, getMonth(block.timestamp)); uint y; uint p; (y, p) = GetRepaymentType(studentrecords[student].repaymenttype); if(repaymentmonth <= 24 || repaymentmonth > (y * 12)) { return 0; } else { uint amount = studentrecords[student].income <= 1578 ? 0 : (studentrecords[student].income - 1578) * p / 100; return (amount <= debts[student]) ? amount : debts[student]; } } function ResetMonthlyLoanCredit(address student) private { RequireIsFinancier(); for (uint i = 0; i < studentrecords[student].loans.length; i++) { bytes32 loan = studentrecords[student].loans[i]; studentrecords[student].loanlogs[loan].monthlycreditleft = loantypes[loan].maxamount; } } function CalculateExpiryDate(bytes32 loan) private view returns (uint) { RequireIsStudent(); uint8 month = uint8((getMonth(block.timestamp) + loantypes[loan].maxduration - 1) % 12 + 1); uint extrayear = month < getMonth(block.timestamp) ? 1 : 0; uint16 year = uint16(getYear(block.timestamp) + (loantypes[loan].maxduration / 12) + extrayear); return toTimestamp(year, month, 1); } function GetToPayThisMonth() public view returns (uint) { RequireIsStudent(); return studentrecords[msg.sender].topaythismonth; } function GetRepaymentYearsLeft() public view returns (uint) { RequireIsStudent(); bytes32 empty = "/"; if(studentrecords[msg.sender].repaymenttype == empty) { return 0; } uint y; uint p; (y, p) = GetRepaymentType(studentrecords[msg.sender].repaymenttype); if(studentrecords[msg.sender].repaymentstartdate == 0) { return y; } else { uint monthsdifference = GetDifferenceInMonths(studentrecords[msg.sender].repaymentstartdate, block.timestamp); return monthsdifference >= (y * 12) ? 0 : (y * 12) - monthsdifference; } } function GetOwnRepaymentType() public view returns (bytes32) { RequireIsStudent(); require(IsActiveStudent()); return studentrecords[msg.sender].repaymenttype; } function GetNumberOfLoans() public view returns (uint) { RequireIsStudent(); return studentrecords[msg.sender].loans.length; } function GetLoanLog(uint index) public view returns (bytes32 l, uint c, uint y, uint m, uint d) { RequireIsStudent(); require(studentrecords[msg.sender].loans.length > index); bytes32 loan = studentrecords[msg.sender].loans[index]; uint expirydate = studentrecords[msg.sender].loanlogs[loan].expirydate; return (loan, studentrecords[msg.sender].loanlogs[loan].monthlycreditleft, getYear(expirydate), getMonth(expirydate), getDay(expirydate)); } function GetMaxAmount(bytes32 loan) public view returns (uint) { return loantypes[loan].maxamount; } function KillContract() public { RequireIsFinancier(); require(activestudents.length == 0); selfdestruct(financier); } function RequireIsStudent() view private { require(msg.sender != financier); } function RequireIsFinancier() view private { require(msg.sender == financier); } function GetDifferenceInMonths(uint timestamp1, uint timestamp2) private pure returns (uint) { uint oldest = timestamp1 <= timestamp2 ? timestamp1 : timestamp2; uint newest = timestamp1 > timestamp2 ? timestamp1 : timestamp2; uint months = (getYear(newest) - getYear(oldest)) * 12; return months += getMonth(oldest) < getMonth(newest) ? getMonth(newest) - getMonth(oldest) : 12 - getMonth(oldest) + getMonth(newest); } function EurToWei(uint e) pure private returns (uint) { return e * 2500000000000000; } function WeiToEur(uint w) pure private returns (uint) { return w / 2500000000000000; } struct _DateTime { uint16 year; uint8 month; uint8 day; } uint constant DAY_IN_SECONDS = 86400; uint constant YEAR_IN_SECONDS = 31536000; uint constant LEAP_YEAR_IN_SECONDS = 31622400; uint16 constant ORIGIN_YEAR = 1970; function isLeapYear(uint16 year) private pure returns (bool) { if (year % 4 != 0) { return false; } if (year % 100 != 0) { return true; } if (year % 400 != 0) { return false; } return true; } function leapYearsBefore(uint year) private pure returns (uint) { year -= 1; return year / 4 - year / 100 + year / 400; } function getDaysInMonth(uint8 month, uint16 year) private pure returns (uint8) { if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) { return 31; } else if (month == 4 || month == 6 || month == 9 || month == 11) { return 30; } else if (isLeapYear(year)) { return 29; } else { return 28; } } function parseTimestamp(uint timestamp) internal pure returns (_DateTime dt) { uint secondsAccountedFor = 0; uint buf; uint8 i; dt.year = getYear(timestamp); buf = leapYearsBefore(dt.year) - leapYearsBefore(ORIGIN_YEAR); secondsAccountedFor += LEAP_YEAR_IN_SECONDS * buf; secondsAccountedFor += YEAR_IN_SECONDS * (dt.year - ORIGIN_YEAR - buf); uint secondsInMonth; for (i = 1; i <= 12; i++) { secondsInMonth = DAY_IN_SECONDS * getDaysInMonth(i, dt.year); if (secondsInMonth + secondsAccountedFor > timestamp) { dt.month = i; break; } secondsAccountedFor += secondsInMonth; } for (i = 1; i <= getDaysInMonth(dt.month, dt.year); i++) { if (DAY_IN_SECONDS + secondsAccountedFor > timestamp) { dt.day = i; break; } secondsAccountedFor += DAY_IN_SECONDS; } } function getYear(uint timestamp) private pure returns (uint16) { uint secondsAccountedFor = 0; uint16 year; uint numLeapYears; year = uint16(ORIGIN_YEAR + timestamp / YEAR_IN_SECONDS); numLeapYears = leapYearsBefore(year) - leapYearsBefore(ORIGIN_YEAR); secondsAccountedFor += LEAP_YEAR_IN_SECONDS * numLeapYears; secondsAccountedFor += YEAR_IN_SECONDS * (year - ORIGIN_YEAR - numLeapYears); while (secondsAccountedFor > timestamp) { if (isLeapYear(uint16(year - 1))) { secondsAccountedFor -= LEAP_YEAR_IN_SECONDS; } else { secondsAccountedFor -= YEAR_IN_SECONDS; } year -= 1; } return year; } function getMonth(uint timestamp) private pure returns (uint8) { return parseTimestamp(timestamp).month; } function getDay(uint timestamp) private pure returns (uint8) { return parseTimestamp(timestamp).day; } function toTimestamp(uint16 year, uint8 month, uint8 day) private pure returns (uint timestamp) { uint16 i; for (i = ORIGIN_YEAR; i < year; i++) { if (isLeapYear(i)) { timestamp += LEAP_YEAR_IN_SECONDS; } else { timestamp += YEAR_IN_SECONDS; } } uint8[12] memory monthDayCounts; monthDayCounts[0] = 31; if (isLeapYear(year)) { monthDayCounts[1] = 29; } else { monthDayCounts[1] = 28; } monthDayCounts[2] = 31; monthDayCounts[3] = 30; monthDayCounts[4] = 31; monthDayCounts[5] = 30; monthDayCounts[6] = 31; monthDayCounts[7] = 31; monthDayCounts[8] = 30; monthDayCounts[9] = 31; monthDayCounts[10] = 30; monthDayCounts[11] = 31; for (i = 1; i < month; i++) { timestamp += DAY_IN_SECONDS * monthDayCounts[i - 1]; } timestamp += DAY_IN_SECONDS * (day - 1); return timestamp; } }"}
    });

	document.getElementsByClassName('copied')[1].style.display = "inline";
	document.getElementsByClassName('uncopied')[1].style.display = "none";
}

function launchContract()
{
	var launch = true;
	var accountindex = 0;
	var gaslimit = 100000000;

	if (typeof web3 !== 'undefined')
	{
		web3 = new Web3(web3.currentProvider);
	} 
	else 
	{
		web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	}

	try
	{
		web3.eth.defaultAccount = web3.eth.accounts[0];
	}
	catch (err)
	{
		alert('Error: Type 5');
		ThrowError();
		return;
	}

	var StudentFinanceContract = web3.eth.contract(
		[
			{
				"constant": true,
				"inputs": [],
				"name": "GetNumberActiveStudents",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetDebt",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "loantype",
						"type": "bytes32"
					},
					{
						"name": "amounteuro",
						"type": "uint256"
					}
				],
				"name": "Loan",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"name": "index",
						"type": "uint256"
					}
				],
				"name": "GetLoanLog",
				"outputs": [
					{
						"name": "l",
						"type": "bytes32"
					},
					{
						"name": "c",
						"type": "uint256"
					},
					{
						"name": "y",
						"type": "uint256"
					},
					{
						"name": "m",
						"type": "uint256"
					},
					{
						"name": "d",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "income",
						"type": "uint256"
					},
					{
						"name": "incomeparents",
						"type": "uint256"
					}
				],
				"name": "InitializeStudentRecord",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "loantype",
						"type": "bytes32"
					}
				],
				"name": "AcceptLoan",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "name",
						"type": "bytes32"
					},
					{
						"name": "maxamounteuro",
						"type": "uint256"
					},
					{
						"name": "maxdurationyears",
						"type": "uint256"
					},
					{
						"name": "maxincome",
						"type": "uint256"
					},
					{
						"name": "maxincomeparents",
						"type": "uint256"
					},
					{
						"name": "repaymenttype",
						"type": "bytes32"
					}
				],
				"name": "CreateLoanType",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetToPayThisMonth",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [],
				"name": "KillContract",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "amount",
						"type": "uint256"
					}
				],
				"name": "Withdraw",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetAddressContract",
				"outputs": [
					{
						"name": "",
						"type": "address"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"name": "year",
						"type": "uint256"
					}
				],
				"name": "GetYearInterest",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetInformation",
				"outputs": [
					{
						"name": "i",
						"type": "uint256"
					},
					{
						"name": "ip",
						"type": "uint256"
					},
					{
						"name": "s",
						"type": "bool"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"name": "loan",
						"type": "bytes32"
					}
				],
				"name": "AlreadyHasLoan",
				"outputs": [
					{
						"name": "",
						"type": "bool"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "name",
						"type": "bytes32"
					},
					{
						"name": "maxyears",
						"type": "uint256"
					},
					{
						"name": "maxpercentageincome",
						"type": "uint256"
					}
				],
				"name": "CreateRepaymentType",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetDate",
				"outputs": [
					{
						"name": "y",
						"type": "uint256"
					},
					{
						"name": "m",
						"type": "uint256"
					},
					{
						"name": "d",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"name": "student",
						"type": "address"
					}
				],
				"name": "CalculateMonthlyRepayAmount",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "income",
						"type": "uint256"
					},
					{
						"name": "incomeparents",
						"type": "uint256"
					},
					{
						"name": "studying",
						"type": "bool"
					}
				],
				"name": "UpdateStudentRecord",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "student",
						"type": "address"
					}
				],
				"name": "PayDebt",
				"outputs": [],
				"payable": true,
				"stateMutability": "payable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"name": "loan",
						"type": "bytes32"
					}
				],
				"name": "IsEligibleFor",
				"outputs": [
					{
						"name": "",
						"type": "bool"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "name",
						"type": "bytes32"
					}
				],
				"name": "ActivateLoanType",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetRepaymentYearsLeft",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetOwnRepaymentType",
				"outputs": [
					{
						"name": "",
						"type": "bytes32"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetDateContract",
				"outputs": [
					{
						"name": "y",
						"type": "uint256"
					},
					{
						"name": "m",
						"type": "uint256"
					},
					{
						"name": "d",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetBalanceContract",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetNumberOfLoans",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "year",
						"type": "uint256"
					},
					{
						"name": "interest",
						"type": "uint256"
					}
				],
				"name": "AddYearInterest",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"name": "loan",
						"type": "bytes32"
					}
				],
				"name": "GetMaxAmount",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "name",
						"type": "bytes32"
					}
				],
				"name": "DeactivateLoanType",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [
					{
						"name": "name",
						"type": "bytes32"
					}
				],
				"name": "GetRepaymentType",
				"outputs": [
					{
						"name": "y",
						"type": "uint256"
					},
					{
						"name": "p",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [],
				"name": "Deposit",
				"outputs": [],
				"payable": true,
				"stateMutability": "payable",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetAddress",
				"outputs": [
					{
						"name": "",
						"type": "address"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": true,
				"inputs": [],
				"name": "GetBalance",
				"outputs": [
					{
						"name": "",
						"type": "uint256"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "constructor"
			}
		]
	);

	var StudentFinance = StudentFinanceContract.at(document.getElementById("contractaddress").value);

	LaunchPOF();

	$("#addstudent").click(function()
	{
		var student = document.getElementsByClassName('newstudent')[0];
		student.style.display = "?";
		student.classList.remove("newstudent");
		web3.eth.defaultAccount = web3.eth.accounts[$('.users .row').index(student) - 1];
		{
			InitializeStudent();
		}
		web3.eth.defaultAccount = web3.eth.accounts[accountindex];
		if(!document.getElementsByClassName('newstudent')[0]){
			document.getElementById('addstudent').remove();
		}
	});

	function InitializeStudent(){
		try
		{
			StudentFinance.InitializeStudentRecord(0, 0, {gas: gaslimit});
			toastr.success('', 'Student Created');
		}
		catch
		{
			toastr.error('', 'Failed: Not Created');
		}
	}

	$('.users .account').click(function(){
		document.getElementById('interface').style.padding = "0px 50px 0px 0px";
		accountindex = Math.floor($('.account').index(this) / 2);
		web3.eth.defaultAccount = web3.eth.accounts[accountindex];
		$("#showuser").html($(this).text().split(" ")[0]);
		switch(accountindex) {
			case 0:
				$("#showuser").html("FINANCIER");
				document.getElementsByClassName('financierrows')[0].style.display = "block";
				document.getElementsByClassName('financierrows')[1].style.display = "block";
				document.getElementsByClassName('financierrows')[2].style.display = "block";
				document.getElementsByClassName('studentrows')[0].style.display = "none";
				document.getElementsByClassName('studentrows')[1].style.display = "none";
				document.getElementsByClassName('studentrows')[2].style.display = "none";
				document.getElementsByClassName('contractrows')[0].style.display = "none";
				document.getElementsByClassName('interfacetitle')[0].innerHTML = "USER INFORMATION";
				break;
			default:
				$("#showuser").html("STUDENT " + accountindex);
				document.getElementsByClassName('financierrows')[0].style.display = "none";
				document.getElementsByClassName('financierrows')[1].style.display = "none";
				document.getElementsByClassName('financierrows')[2].style.display = "none";
				document.getElementsByClassName('studentrows')[0].style.display = "block";
				document.getElementsByClassName('studentrows')[1].style.display = "block";
				document.getElementsByClassName('studentrows')[2].style.display = "block";
				document.getElementsByClassName('contractrows')[0].style.display = "none";
				UpdateStudentInfo();
		}
		UpdateInfo();
	});
	
	$('.extra .account').click(function(){
		if(accountindex == 0)
		{
			document.getElementById('interface').style.padding = "0% 10% 0% 10%";
			$("#showaddress").html(StudentFinance.GetAddressContract({gas: gaslimit}));
			$("#showbalance").html(StudentFinance.GetBalanceContract({gas: gaslimit}).c[0]);
			GetDate();
			document.getElementsByClassName('financierrows')[0].style.display = "none";
			document.getElementsByClassName('financierrows')[1].style.display = "none";
			document.getElementsByClassName('financierrows')[2].style.display = "none";
			document.getElementsByClassName('contractrows')[0].style.display = "block";
			document.getElementsByClassName('interfacetitle')[0].innerHTML = "CONTRACT INFORMATION";
		}
		else
		{
			toastr.error('', 'For Financier Only');
		}
	});

	$(document).on('click', '#deposit', function(){
		var amount = EurToWei(document.getElementById('depositamount').value);
		if(amount > 0)
		{
			try
			{
				StudentFinance.Deposit({from: web3.eth.accounts[0], gas: gaslimit, value: amount});
				TransactionSuccessful();
			}
			catch
			{
				TransactionFailed();
			}
			$("#showbalance").html(StudentFinance.GetBalanceContract().c[0], {gas: gaslimit});
			document.getElementById('depositamount').value = "";
			UpdateBalances();
		}
	});

	$(document).on('click', '#withdraw', function(){
		var amount = EurToWei(document.getElementById('withdrawamount').value);
		if(amount > 0)
		{
			try
			{
				StudentFinance.Withdraw(amount, {gas: gaslimit});
				TransactionSuccessful();
			}
			catch
			{
				TransactionFailed();
			}
			$("#showbalance").html(StudentFinance.GetBalanceContract().c[0], {gas: gaslimit});
			document.getElementById('depositamount').value = "";
			UpdateBalances();
		}
	});

	$(document).on('click', '.killcontract', function(){
		try
		{
			StudentFinance.KillContract({gas: gaslimit});
			toastr.success('', 'Contract Killed');
			ThrowError();
		}
		catch
		{
			toastr.error('', 'Failed: Conditions Not Met');
		}
		
	});
	
	$(document).on('click', '.toggleloan .toggle', function(){
		if(this.classList.contains('btn-success') || this.classList.contains('newtoggle'))
		{
			try
			{
				StudentFinance.ActivateLoanType(web3.toHex(document.getElementsByClassName('loanrow')[$('.toggleloan .toggle').index(this) + 1].getElementsByClassName('value')[0].innerHTML), {gas: gaslimit});
				toastr.success('', 'Loan Activated');
			}
			catch
			{
				toastr.error('', 'Failed: Not Activated');
			}
		}
		else
		{
			try
			{
				StudentFinance.DeactivateLoanType(web3.toHex(document.getElementsByClassName('loanrow')[$('.toggleloan .toggle').index(this) + 1].getElementsByClassName('value')[0].innerHTML), {gas: gaslimit});
				toastr.success('', 'Loan Deactivated');
			}
			catch
			{
				toastr.error('', 'Failed: Not Deactivated');
			}
		}
	});

	$(document).on('click', '.newtoggle', function(){
		document.getElementsByClassName('newtoggle')[0].getElementsByClassName('toggle-group')[1].remove();
		var cnt = $('.newtoggle').contents();
		$('.newtoggle').replaceWith(cnt);
	});

	$(document).on('click', '.deleteloan', function(){
		if(!document.querySelectorAll(".toggleloan .toggle")[$('.deleteloan').index(this)].classList.contains('btn-success'))
		{
			document.getElementsByClassName('loanrow')[$('.deleteloan').index(this) + 1].remove();
			toastr.success('', 'Loan Deleted');
		}
		else
		{
			toastr.error('', 'Failed: Not Deleted');
		}
	});

	$("#addloanbutton").click(function(){
		$('#selectedrepayment').html("Select Repayment");
		document.getElementById("addloan").disabled = true;
	});

	$("#addloan").click(function(){
		try
		{
			var name = document.querySelectorAll("#addloanmodal .form-control")[0];
			var amount = document.querySelectorAll("#addloanmodal .form-control")[1];
			var duration = document.querySelectorAll("#addloanmodal .form-control")[2];
			var income = document.querySelectorAll("#addloanmodal .form-control")[3];
			var parents = document.querySelectorAll("#addloanmodal .form-control")[4];
			var repayment = $.trim(document.getElementById('selectedrepayment').innerHTML);
			StudentFinance.CreateLoanType(web3.toHex(name.value), amount.value, duration.value, income.value, parents.value, web3.toHex(repayment), {gas: gaslimit});
			document.getElementsByClassName('loanrow')[0].style.display = "flex";
			clone = document.getElementsByClassName('loanrow')[1].cloneNode(true);
			clone.getElementsByClassName('value')[0].innerHTML = name.value;
			clone.getElementsByClassName('value')[1].innerHTML = amount.value;
			clone.getElementsByClassName('value')[2].innerHTML = duration.value;
			clone.getElementsByClassName('value')[3].innerHTML = income.value;
			clone.getElementsByClassName('value')[4].innerHTML = parents.value;
			clone.getElementsByClassName('value')[5].innerHTML = repayment;
			clone.getElementsByClassName('toggle')[0].classList.add('newtoggle');
			clone.style.display = "flex";
			document.getElementsByClassName('financierrows')[0].insertBefore(clone, document.querySelectorAll(".financierrows .insertbefore")[0]);
			name.value = "";
			amount.value = "";
			duration.value = "";
			income.value = "";
			parents.value = "";
			toastr.success('', 'Loan Created');
			$('.newtoggle').trigger("click");
		}
		catch
		{
			toastr.error('', 'Failed: Not Valid');
		}
	});

	$("#editinformation").click(function(){
	try
	{
		var income = document.querySelectorAll("#editinfomodal .form-control")[0];
		var incomeparents = document.querySelectorAll("#editinfomodal .form-control")[1];
		StudentFinance.UpdateStudentRecord(income.value, incomeparents.value, document.querySelectorAll("#editinfomodal .toggle")[0].classList.contains('btn-success'), {gas: gaslimit});
		UpdateStudentInfo();
		income.value = "";
		incomeparents.value = "";
		toastr.success('', 'Information Updated');
	}
	catch
	{
		toastr.error('', 'Failed: Not Valid');
	}
	});

	$("#addrepayment").click(function(){
		try
		{
			var name = document.querySelectorAll("#addrepaymentmodal .form-control")[0];
			var duration = document.querySelectorAll("#addrepaymentmodal .form-control")[1];
			var share = document.querySelectorAll("#addrepaymentmodal .form-control")[2];
			StudentFinance.CreateRepaymentType(web3.toHex(name.value), duration.value, share.value, {gas: gaslimit});
			document.getElementsByClassName('repaymentrow')[0].style.display = "flex";
			clone = document.getElementsByClassName('repaymentrow')[1].cloneNode(true);
			clone.getElementsByClassName('value')[0].innerHTML = name.value;
			clone.getElementsByClassName('value')[1].innerHTML = duration.value;
			clone.getElementsByClassName('value')[2].innerHTML = share.value;
			clone.style.display = "flex";
			document.getElementsByClassName('financierrows')[1].insertBefore(clone, document.querySelectorAll(".financierrows .insertbefore")[1]);
			document.querySelectorAll("#addloanmodal .dropdown")[0].style.display = "block";
			document.querySelectorAll("#addloanmodal .createrepayment")[0].style.display = "none";
			clone2 = document.getElementsByClassName('repaymentitem')[0].cloneNode(true);
			clone2.innerHTML = name.value;
			clone2.style.display = "block";
			clone2.classList.remove('repaymentitem');
			document.getElementById('repaymentdropdown').insertBefore(clone2, document.getElementsByClassName('repaymentitem')[0]);
			name.value = "";
			duration.value = "";
			share.value = "";
			toastr.success('', 'Repayment Created');
		}
		catch
		{
			toastr.error('', 'Failed: Not Valid');
		}
	});

	$('.acceptloanbutton').click(function(){
		var income = document.getElementById('showincome').innerHTML;
		var incomeparents = document.getElementById('showincome').innerHTML;
		ResetLoans();
		if(document.getElementById('showstudying').style.color == "rgb(40, 167, 69)")
		{
			document.getElementById('loansavailable').style.display = "block";
			document.getElementById('noloansavailable').style.display = "none";
			document.querySelectorAll('#acceptloanmodal .modal-dialog')[0].style.maxWidth = "750px";

			var length = document.getElementsByClassName('loanrow').length;
			for(i = 2; i < length; i++)
			{
				var loanrow = document.getElementsByClassName('loanrow')[i];
				var name = loanrow.getElementsByClassName('value')[0].innerHTML;

				if(StudentFinance.IsEligibleFor(web3.toHex(name), {gas: gaslimit}) && !StudentFinance.AlreadyHasLoan(web3.toHex(name), {gas: gaslimit}))
				{
					var repayment = loanrow.getElementsByClassName('value')[5].innerHTML;
					let[y, p] = StudentFinance.GetRepaymentType(web3.toHex(repayment), {gas: gaslimit});
					document.getElementsByClassName('acceptloanrow')[0].style.display = "flex";
					clone = document.getElementsByClassName('acceptloanrow')[1].cloneNode(true);
					clone.getElementsByClassName('value')[0].innerHTML = name;
					clone.getElementsByClassName('value')[1].innerHTML = loanrow.getElementsByClassName('value')[1].innerHTML;
					clone.getElementsByClassName('value')[2].innerHTML = loanrow.getElementsByClassName('value')[2].innerHTML;
					clone.getElementsByClassName('value')[3].innerHTML = y.c[0];
					clone.getElementsByClassName('value')[4].innerHTML = p.c[0];
					clone.style.display = "flex";
					document.querySelectorAll('#acceptloanmodal .modal-body')[1].insertBefore(clone, document.querySelectorAll("#loansavailable .insertbefore")[0]);
				}
			}
		}

		if(document.getElementsByClassName('acceptloanrow').length == 2)
		{
			document.getElementById('loansavailable').style.display = "none";
			document.getElementById('noloansavailable').style.display = "block";
			document.querySelectorAll('#acceptloanmodal .modal-dialog')[0].style.maxWidth = "500px";
		}
	});

	$(document).on('click', '.acceptthisloan', function(){
		try
		{
			var loan = $('.acceptloanrow')[$('.acceptthisloan').index(this) + 1].getElementsByClassName('value')[0].innerHTML;
			StudentFinance.AcceptLoan(web3.toHex(loan), {gas: gaslimit});
			UpdateLoans();
			UpdateDebt();
			toastr.success('', 'Loan Accepted');
		}
		catch
		{
			toastr.error('', 'Failed: Not Accepted');
		}
	});

	$(document).on('click', '.loannowbutton', function(){
		var loanname = document.getElementsByClassName('loanrowstudent')[$('.loannowbutton').index(this) + 1].getElementsByClassName('value')[0].innerHTML;
		var amount = document.getElementsByClassName('loanrowstudent')[$('.loannowbutton').index(this) + 1].getElementsByClassName('form-control')[0].value;
		if(amount > 0)
		{
			try
			{
				StudentFinance.Loan(web3.toHex(loanname), amount, {gas: gaslimit});
				UpdateInfo();
				UpdateStudentInfo();
				TransactionSuccessful();
			}
			catch
			{
				if(StudentFinance.GetBalanceContract({gas: gaslimit}).c[0] < amount)
				{
					toastr.error('', 'Transaction Failed: Low Contract Balance. Please Contact Financier.');
				}
				else
				{
					TransactionFailed();
				}
			}
		}
		else
		{
			TransactionFailed();
		}
	});

	function UpdateLoans(){
		while($('.loanrowstudent').length > 2)
		{
			document.getElementsByClassName('loanrowstudent')[$('.loanrowstudent').length - 1].remove();
		}

		for(var i = 0; i < StudentFinance.GetNumberOfLoans({gas: gaslimit}).c[0]; i++)
		{
			let[l, x, y, m, d] = StudentFinance.GetLoanLog(i, {gas: gaslimit});
			document.getElementsByClassName('loanrowstudent')[0].style.display = "flex";
			clone = document.getElementsByClassName('loanrowstudent')[1].cloneNode(true);
			clone.getElementsByClassName('value')[0].innerHTML = web3.toAscii(l);
			clone.getElementsByClassName('value')[1].innerHTML = d.c[0];
			clone.getElementsByClassName('value')[2].innerHTML = m.c[0];
			clone.getElementsByClassName('value')[3].innerHTML = y.c[0];
			clone.getElementsByClassName('value')[4].innerHTML = x.c[0];
			clone.getElementsByClassName('value')[5].innerHTML = StudentFinance.GetMaxAmount(l, {gas: gaslimit}).c[0];
			clone.style.display = "flex";
			document.getElementsByClassName('studentrows')[1].insertBefore(clone, document.getElementsByClassName('acceptloanbutton')[0]);
		}
	}

	function ResetLoans(){
		while($('.acceptloanrow').length > 2)
		{
			document.getElementsByClassName('acceptloanrow')[$('.acceptloanrow').length - 1].remove();
		}
	}

	$(document).on('click', '.deleterepayment', function(){
		var repayment = document.getElementsByClassName('repaymentrow')[$('.deleterepayment').index(this) + 1].getElementsByClassName('value')[0].innerHTML;
		$('#repaymentdropdown .dropdown-item').each(function(){
			if($(this).text() == repayment)
			{
				$(this).remove();
				if(document.querySelectorAll('#repaymentdropdown .dropdown-item').length == 1)
				{
					document.querySelectorAll("#addloanmodal .dropdown")[0].style.display = "none";
					document.querySelectorAll("#addloanmodal .createrepayment")[0].style.display = "block";
				}
			}		
		});
		document.getElementsByClassName('repaymentrow')[$('.deleterepayment').index(this) + 1].style.display = "none";
		toastr.success('', 'Repayment Deleted');
	});

	$(document).on('click', '#repaymentdropdown .dropdown-item', function()
	{
		$('#selectedrepayment').html($(this).text());
		document.getElementById("addloan").disabled = false;
	});

	$(document).on('click', '#yeardropdown .dropdown-item', function()
	{
		$('#selectedyear').html($(this).text());
		$('#showinterest').html(StudentFinance.GetYearInterest($(this).text()).toString(), {gas: gaslimit});
		UpdateInterestButtons();
	});

	function UpdateInterestButtons()
	{
		let [y, m, d] = StudentFinance.GetDate({gas: gaslimit});
		if(y.c[0] < $.trim(document.getElementById('selectedyear').innerHTML) || StudentFinance.GetNumberActiveStudents({gas: gaslimit}) == 0)
		{
			document.getElementById("enterinterest").style.display = "block";
			document.getElementById("editinterest").style.display = "block";
		}
		else
		{
			document.getElementById("enterinterest").style.display = "none";
			document.getElementById("editinterest").style.display = "none";
		}
	}

	$(document).on('click', '#editinterest', function()
	{
		if(document.getElementById('enterinterest').value != "")
		{
			try
			{
				StudentFinance.AddYearInterest($.trim(document.getElementById('selectedyear').innerHTML), document.getElementById('enterinterest').value, {gas: gaslimit});
				$('#showinterest').html(StudentFinance.GetYearInterest($.trim(document.getElementById('selectedyear').innerHTML), {gas: gaslimit}).toString());
				document.getElementById('enterinterest').value = "";
				toastr.success('', 'Interest Updated');
			}
			catch
			{
				toastr.error('', 'Failed: Not Updated');
			}
		}
	});

	function web3StringToBytes32(text) 
	{
		var result = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text));
		while (result.length < 66) { result += '0'; }
		if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
		return result;
	}

	function GetAddress()
	{
		try
		{
			$("#showaddress").html(StudentFinance.GetAddress({gas: gaslimit}));
		}
		catch
		{
			alert('Error: Type 1');
			ThrowError();
		}
	}

	function GetBalance()
	{
		try
		{
			$("#showbalance").html(StudentFinance.GetBalance({gas: gaslimit}).c[0]);
		}
		catch
		{
			alert('Error: Type 2');
			ThrowError();
		}
	}

	function GetDate()
	{
		try
		{
			let [y, m, d] = StudentFinance.GetDebt({gas: gaslimit});
			$("#showdate").html(d.c[0] + " / " + m.c[0] + " / " + y.c[0]);
		}
		catch
		{
			$("#showdate").html(" - / - / -");
		}
	}

	function LaunchPOF()
	{
		try
		{
			StudentFinance.GetBalance({gas: gaslimit});
			ShowProofOfConcept();
		}
		catch
		{
			alert('Error: Type 3');
			ThrowError();
		}

		let [y, m, d] = StudentFinance.GetDateContract({gas: gaslimit});
		let [y2, m2, d2] = StudentFinance.GetDate({gas: gaslimit});
		$("#showdatenow").html(d2.c[0] + " / " + m2.c[0] + " / " + y2.c[0]);

		for(year = y.c[0]; year <= y2.c[0] + 1; year++)
		{
			AddYear(year);
		}

		$('#selectedyear').html(y2.c[0]);
		$('#showinterest').html(StudentFinance.GetYearInterest(y2.c[0]).toString(), {gas: gaslimit});
		UpdateInterestButtons();
		UpdateInfo();
	}

	function UpdateInfo()
	{
		GetAddress();
		GetDate();
		GetBalance();
		UpdateBalances();
	}

	function UpdateStudentInfo()
	{
		let [i, ip, s] = StudentFinance.GetInformation({gas: gaslimit});
		$('#showincome').html(i.c[0]);
		$('#showincomeparents').html(ip.c[0]);
		if(s)
		{
			$('#studytoggle').bootstrapToggle('on');
			document.getElementById('showstudying').style.color = '#28a745';
		}
		else
		{
			$('#studytoggle').bootstrapToggle('off');
			document.getElementById('showstudying').style.color = '#dc3545';
		}

		UpdateDebt();
		UpdateLoans();
	}

	
	function UpdateDebt()
	{
		try
		{
			var debt = StudentFinance.GetDebt({gas: gaslimit}).c[0];
			$("#showdebt").html(debt);
			if(debt > 0)
			{
				document.getElementById("repayamountbutton").style.display = "block";
				document.getElementById("repayamount").style.display = "block";
			}
			else
			{
				document.getElementById("repayamountbutton").style.display = "none";
				document.getElementById("repayamount").style.display = "none";
			}
			var totaltopay = StudentFinance.CalculateMonthlyRepayAmount(StudentFinance.GetAddress({gas: gaslimit}), {gas: gaslimit}).c[0];
			var topay = totaltopay - StudentFinance.GetToPayThisMonth({gas: gaslimit}).c[0];
			$("#showtotaltopay").html(totaltopay);
			$("#showtopay").html(topay);
			$("#showrepayyears").html(StudentFinance.GetRepaymentYearsLeft({gas: gaslimit}).c[0]);
			try
			{
				let[y, p] = StudentFinance.GetRepaymentType(StudentFinance.GetOwnRepaymentType({gas: gaslimit}), {gas: gaslimit});
				$("#showrepaypercentage").html(p.c[0]);
			}
			catch
			{
				$("#showrepaypercentage").html(0);
			}
		}
		catch
		{
			alert('Error: Type 4');
			ThrowError();
		}
	}

	$(document).on('click', '#repayamountbutton', function(){
		try
		{
			var amount = EurToWei(document.getElementById('repayamount').value);
			StudentFinance.PayDebt(StudentFinance.GetAddress({gas: gaslimit}), {from: web3.eth.accounts[accountindex], gas: gaslimit, value: amount});
			UpdateInfo();
			UpdateStudentInfo();
			TransactionSuccessful();
		}
		catch
		{
			TransactionFailed();
		}		
	});

	function AddYear(year)
	{
		clone = document.getElementsByClassName('yearitem')[0].cloneNode(true);
		clone.innerHTML = year;
		clone.style.display = "block";
		clone.classList.remove('yearitem');
		document.getElementById('yeardropdown').insertBefore(clone, document.getElementsByClassName('yearitem')[0]);
	}

	
	function UpdateBalances()
	{
		for (i = 0; i < 4; i++) { 
			web3.eth.defaultAccount = web3.eth.accounts[i];
			$(".showbalance").html
			document.getElementsByClassName('showbalance')[i].innerHTML = StudentFinance.GetBalance({gas: gaslimit}).c[0];	
		}
		web3.eth.defaultAccount = web3.eth.accounts[accountindex];
		document.querySelectorAll(".extra .showbalance")[0].innerHTML = StudentFinance.GetBalanceContract({gas: gaslimit}).c[0];
	}
}

function ThrowError()
{
	document.getElementById("proofofconcept").style.display = "none";
	document.getElementById("throwerror").style.display = "block";
	document.getElementsByClassName('ninety')[0].style.backgroundColor = "transparent";
}

function EurToWei(e)
{
	return e * 2500000000000000;
}

function WeiToEur(w)
{
	return w / 2500000000000000;
}


function ShowProofOfConcept()
{
	document.getElementById("throwerror").style.display = "none";
	document.body.style.background = "none";
	document.body.style.backgroundColor = "#fafafa";

	$('.ten').animate({
		'opacity': '0'
	}, 0, function () {
		$('.ninety').css({
			'height': "100%"
		});
		$('#slider ul').css({
			'height': "100%"
		});
		$('.ten').css({
			'display': "none"
		}); 
	});

	$('.ninety').animate({
		'opacity': '0'
	}, 500, function () {
		$('#proofofconcept').css({
			'display': "block"
		});
	});

	$('.ninety').animate({
			'opacity': '1'
	}, 1000);

	toastr.success('', 'Contract Launched');
}

function TransactionSuccessful()
{
	toastr.success('', 'Transaction Successful');
}

function TransactionFailed()
{
	toastr.error('', 'Transaction Failed');
}


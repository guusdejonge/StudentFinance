pragma solidity ^0.4.0;

contract StudentFinance
{
    address private financier;
    mapping (address => uint) private debts;
    address[] private activestudents;
    mapping (address => Student) private studentrecords;
    bytes32[] private activeloantypes;
    mapping (bytes32 => LoanType) private loantypes;
    RepaymentType[] private repaymenttypes;
    bytes32[] private loancategories;
    address[] private defaulters;
    mapping (uint => uint) private interests;
    
    struct Student
    {
        uint startdate;
        uint income;
        uint incomeparents;
        bool studying;
        bytes32[] loans;
        mapping (bytes32 => LoanLog) loanlogs;
        bytes32 repaymenttype;
        uint repaymentstartdate;
        uint topaythismonth;
    }
    
    struct LoanLog
    {
        uint monthlycreditleft;
        uint expirydate;
    }

    struct LoanType
    {
        uint maxamount;
        uint maxduration;
        uint maxincome;
        uint maxincomeparents;
        bytes32 repaymenttype;
    }
    
    struct RepaymentType
    {
        bytes32 name;
        uint maxyears;
        uint maxpercentageincome;
    }

    constructor() public
    {
        financier = msg.sender;
    }

    function GetAddress() public view returns (address)
    {
        return msg.sender;
    }

    function GetAddressFinancier() public view returns (address)
    {
        return financier;
    }
    
    function GetAddressContract() public view returns (address)
    {
        return this;
    }
    
    function GetBalance() public view returns (uint)
    {
        return WeiToEur(msg.sender.balance);
    }
    
    function GetBalanceContract() public view returns (uint)
    {
        RequireIsFinancier;
        return WeiToEur(address(this).balance);
    }

    function Deposit() payable public
    {
        RequireIsFinancier();
    }

    function Withdraw(uint amount) public
    {
        RequireIsFinancier();
        require(address(this).balance >= amount);
        msg.sender.transfer(amount);
    }
    
    function GetDebt() public view returns (uint)
    {
        RequireIsStudent();
        return (debts[msg.sender]);
    }
    
    function PayDebt(address student) payable public
    {
        uint amounteuro = WeiToEur(msg.value);
        require(debts[student] >= amounteuro);
        debts[student] -= amounteuro;
        studentrecords[student].topaythismonth < amounteuro ? studentrecords[student].topaythismonth = 0 : studentrecords[student].topaythismonth -= amounteuro;
    }
    
    function AcceptLoan(bytes32 loantype) public
    {
        RequireIsStudent();
        require(!AlreadyHasLoan(loantype));
        require(IsEligibleFor(loantype));
        if(!IsActiveStudent())
        {
            activestudents.push(msg.sender);
        }
        InitializeLoanLog(loantype);
    }
  
    function Loan(bytes32 loantype, uint amounteuro) public
    {
        RequireIsStudent();
        require(amounteuro > 0);
        require(IsEligibleFor(loantype));
        require(AlreadyHasLoan(loantype));
        require(studentrecords[msg.sender].loanlogs[loantype].monthlycreditleft >= amounteuro);
        uint amountwei = EurToWei(amounteuro);
        require(address(this).balance >= amountwei);
        msg.sender.transfer(amountwei);
        studentrecords[msg.sender].loanlogs[loantype].monthlycreditleft -= amounteuro;
        debts[msg.sender] += amounteuro;
    }

    function InitializeLoanLog(bytes32 loantype) private
    {
        RequireIsStudent();
        studentrecords[msg.sender].loanlogs[loantype] = LoanLog(loantypes[loantype].maxamount, CalculateExpiryDate(loantype));
        studentrecords[msg.sender].loans.push(loantype);
        studentrecords[msg.sender].repaymenttype = loantypes[loantype].repaymenttype;
    }
    
    function CreateLoanType(bytes32 name, uint maxamounteuro, uint maxdurationyears, uint maxincome, uint maxincomeparents, bytes32 repaymenttype) public
    {
        RequireIsFinancier();
        require(!IsLoanType(name));
        require(IsRepaymentType(repaymenttype));
        require(maxamounteuro > 0);
        require(maxdurationyears >= 1);
        loantypes[name] = LoanType(maxamounteuro, maxdurationyears * 12, maxincome, maxincomeparents, repaymenttype);
    }
    
    function IsLoanType (bytes32 loan) private view returns (bool)
    {
        RequireIsFinancier();
        return loantypes[loan].maxduration != 0;
    }
    
    function ActivateLoanType(bytes32 name) public
    {
        RequireIsFinancier();
        require(IsLoanType(name));
        require(!IsActiveLoanType(name));
        activeloantypes.push(name);
    }

    function DeactivateLoanType(bytes32 name) public
    {
        RequireIsFinancier();
        for(uint i = 0; i < activeloantypes.length; i++)
        {
            if(activeloantypes[i] == name)
            {
                delete activeloantypes[i];
                break;
            }
        }
    }
    
    function IsActiveLoanType(bytes32 s) private view returns (bool)
    {
        for(uint i = 0; i < activeloantypes.length; i++)
        {
            if(activeloantypes[i] == s)
            {
                return true;
            }
        }
        return false;
    }

    function CreateRepaymentType(bytes32 name, uint maxyears, uint maxpercentageincome) public
    {
        RequireIsFinancier;
        require(!IsRepaymentType(name));
        require(maxyears >= 1);
        require(maxpercentageincome > 0);
        repaymenttypes.push(RepaymentType(name, maxyears, maxpercentageincome));
    }
    
    function IsRepaymentType(bytes32 name) private view returns (bool)
    {
        for (uint i = 0; i < repaymenttypes.length; i++ )
        {
            if(repaymenttypes[i].name == name)
            {
                return true;
            }
        }
        return false;
    }
    
    function GetRepaymentType(bytes32 name) public view returns (uint y, uint p)
    {
        require(IsRepaymentType(name));
        for (uint i = 0; i < repaymenttypes.length; i++ )
        {
            if(repaymenttypes[i].name == name)
            {
                return (repaymenttypes[i].maxyears, repaymenttypes[i].maxpercentageincome);
            }
        }
    }

    function IsEligibleFor(bytes32 loan) public view returns (bool)
    {
        return (studentrecords[msg.sender].repaymentstartdate == 0 &&
        studentrecords[msg.sender].studying == true &&
        studentrecords[msg.sender].income <= loantypes[loan].maxincome &&
        studentrecords[msg.sender].incomeparents <= loantypes[loan].maxincomeparents &&
        IsActiveLoanType(loan) || (AlreadyHasLoan(loan) && studentrecords[msg.sender].loanlogs[loan].expirydate >= block.timestamp));
    }
    
    function AlreadyHasLoan(bytes32 loan) public view returns (bool)
    {
        RequireIsStudent();
        return studentrecords[msg.sender].loanlogs[loan].expirydate != 0; 
    }

    function AddYearInterest(uint year, uint interest) public
    {
        RequireIsFinancier();
        require(getYear(block.timestamp) < year || activestudents.length == 0);
        interests[year] = interest;
    }

    function GetYearInterest(uint year) public view returns (uint)
    {
        return interests[year];
    }
    
    function IsActiveStudent() private view returns (bool)
    {
        RequireIsStudent();
        for (uint i = 0; i < activestudents.length; i++ )
        {
            if(activestudents[i] == msg.sender)
            {
                return true;
            }
        }
        return false;
    }
    
    function UpdateStudentRecord(uint income, uint incomeparents, bool studying) public
    {
        RequireIsStudent();
        studentrecords[msg.sender].income = income;
        studentrecords[msg.sender].incomeparents = incomeparents;
        if(studying)
        {
            studentrecords[msg.sender].studying = true;
            studentrecords[msg.sender].repaymentstartdate = 0;
        }
        else
        {
            studentrecords[msg.sender].studying = false;
            studentrecords[msg.sender].repaymentstartdate = toTimestamp(getYear(block.timestamp) + 1, 1, 1);
        }
    }
    
    function MonthlyUpdate() private
    {
        RequireIsFinancier();
        delete defaulters;
        for (uint i = activestudents.length - 1; i >= 0; i--)
        {
            address student = activestudents[i];
            uint y;
            uint p;
            (y, p) = GetRepaymentType(studentrecords[student].repaymenttype);
            if(studentrecords[student].repaymentstartdate != 0 && debts[student] == 0 || GetDifferenceInMonths(studentrecords[student].repaymentstartdate, getMonth(block.timestamp)) > (y * 12))
            {
                delete activestudents[i];
            }
            else if(studentrecords[student].repaymentstartdate != 0)
            {
                if(studentrecords[student].topaythismonth > 0)
                {
                    defaulters.push(student);
                }
                uint term = (getYear(block.timestamp) - getYear(studentrecords[student].repaymentstartdate)) / 5;
                debts[student] += debts[student] * (100 + interests[getYear(studentrecords[student].repaymentstartdate) + term * 5] / 12) / 100;
                studentrecords[student].topaythismonth = studentrecords[student].topaythismonth + CalculateMonthlyRepayAmount(student);
            }
            else
            {
                debts[student] += debts[student] * (100 + interests[getYear(block.timestamp)] / 12) / 100;
                ResetMonthlyLoanCredit(student);
            }
        }
    }

    function CalculateMonthlyRepayAmount(address student) public view returns (uint)
    {
        require(msg.sender == financier || msg.sender == student);
        if(studentrecords[student].repaymentstartdate == 0)
        {
            return 0;
        }
        uint repaymentmonth = GetDifferenceInMonths(studentrecords[student].repaymentstartdate, getMonth(block.timestamp)); 
        uint y;
        uint p;
        (y, p) = GetRepaymentType(studentrecords[student].repaymenttype);
        if(repaymentmonth <= 24 || repaymentmonth > (y * 12))
        {
            return 0;
        }
        else
        {
            uint amount = studentrecords[student].income <= 1578 ? 0 : (studentrecords[student].income - 1578) * p / 100;
            return (amount <= debts[student]) ? amount : debts[student];
        }
    }
    
    function ResetMonthlyLoanCredit(address student) private
    {
        RequireIsFinancier();
        for (uint i = 0; i < studentrecords[student].loans.length; i++)
        {
            bytes32 loan = studentrecords[student].loans[i];
            studentrecords[student].loanlogs[loan].monthlycreditleft = loantypes[loan].maxamount;
        }
    }
    
    function CalculateExpiryDate(bytes32 loan) private view returns (uint)
    {
        RequireIsStudent();
        uint8 month = uint8((getMonth(block.timestamp) + loantypes[loan].maxduration - 1) % 12 + 1);
        uint extrayear = month < getMonth(block.timestamp) ? 1 : 0;
        uint16 year = uint16(getYear(block.timestamp) + (loantypes[loan].maxduration / 12) + extrayear);
        return toTimestamp(year, month, 1);
    }

    function KillContract() public
    {
        RequireIsFinancier();
        require(activestudents.length == 0);
        selfdestruct(financier);
    }
    
    function RequireIsStudent() view private
    {
        require(msg.sender != financier);
    }

    function RequireIsFinancier() view private
    {
        require(msg.sender == financier);
    }
    
    function GetDifferenceInMonths(uint timestamp1, uint timestamp2) private pure returns (uint)
    {
        uint oldest = timestamp1 <= timestamp2 ? timestamp1 : timestamp2;
        uint newest = timestamp1 > timestamp2 ? timestamp1 : timestamp2;
        uint months = (getYear(newest) - getYear(oldest)) * 12;
        return months += getMonth(oldest) < getMonth(newest) ? getMonth(newest) - getMonth(oldest) : 12 - getMonth(oldest) + getMonth(newest);
    }

    function EurToWei(uint e) pure private returns (uint)
    {
        return e * 2500000000000000;
    }

    function WeiToEur(uint w) pure private returns (uint)
    {
        return w / 2500000000000000;
    }

    struct _DateTime 
    {
        uint16 year;
        uint8 month;
        uint8 day;
    }

    uint constant DAY_IN_SECONDS = 86400;
    uint constant YEAR_IN_SECONDS = 31536000;
    uint constant LEAP_YEAR_IN_SECONDS = 31622400;
    uint16 constant ORIGIN_YEAR = 1970;

    function isLeapYear(uint16 year) private pure returns (bool) 
    {
        if (year % 4 != 0) 
        {
            return false;
        }
        if (year % 100 != 0) 
        {
            return true;
        }
        if (year % 400 != 0) 
        {
            return false;
        }
        return true;
    }

    function leapYearsBefore(uint year) private pure returns (uint) 
    {
        year -= 1;
        return year / 4 - year / 100 + year / 400;
    }

    function getDaysInMonth(uint8 month, uint16 year) private pure returns (uint8) 
    {
        if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) 
        {
            return 31;
        }
        else if (month == 4 || month == 6 || month == 9 || month == 11) 
        {
            return 30;
        }
        else if (isLeapYear(year)) 
        {
            return 29;
        }
        else 
        {
            return 28;
        }
    }

    function parseTimestamp(uint timestamp) internal pure returns (_DateTime dt) 
    {
        uint secondsAccountedFor = 0;
        uint buf;
        uint8 i;
        dt.year = getYear(timestamp);
        buf = leapYearsBefore(dt.year) - leapYearsBefore(ORIGIN_YEAR);
        secondsAccountedFor += LEAP_YEAR_IN_SECONDS * buf;
        secondsAccountedFor += YEAR_IN_SECONDS * (dt.year - ORIGIN_YEAR - buf);
        uint secondsInMonth;
        for (i = 1; i <= 12; i++) 
        {
            secondsInMonth = DAY_IN_SECONDS * getDaysInMonth(i, dt.year);
            if (secondsInMonth + secondsAccountedFor > timestamp) 
            {
                dt.month = i;
                break;
            }
            secondsAccountedFor += secondsInMonth;
        }
        for (i = 1; i <= getDaysInMonth(dt.month, dt.year); i++) 
        {
            if (DAY_IN_SECONDS + secondsAccountedFor > timestamp) 
            {
                dt.day = i;
                break;
            }
            secondsAccountedFor += DAY_IN_SECONDS;
        }
    }

    function getYear(uint timestamp) private pure returns (uint16) 
    {
        uint secondsAccountedFor = 0;
        uint16 year;
        uint numLeapYears;
        year = uint16(ORIGIN_YEAR + timestamp / YEAR_IN_SECONDS);
        numLeapYears = leapYearsBefore(year) - leapYearsBefore(ORIGIN_YEAR);
        secondsAccountedFor += LEAP_YEAR_IN_SECONDS * numLeapYears;
        secondsAccountedFor += YEAR_IN_SECONDS * (year - ORIGIN_YEAR - numLeapYears);
        while (secondsAccountedFor > timestamp) 
        {
            if (isLeapYear(uint16(year - 1))) 
            {
                secondsAccountedFor -= LEAP_YEAR_IN_SECONDS;
            }
            else 
            {
                secondsAccountedFor -= YEAR_IN_SECONDS;
            }
            year -= 1;
        }
        return year;
    }

    function getMonth(uint timestamp) private pure returns (uint8) 
    {
        return parseTimestamp(timestamp).month;
    }

    function getDay(uint timestamp) private pure returns (uint8) 
    {
        return parseTimestamp(timestamp).day;
    }

    function toTimestamp(uint16 year, uint8 month, uint8 day) private pure returns (uint timestamp) 
    {
        uint16 i;
        for (i = ORIGIN_YEAR; i < year; i++) 
        {
            if (isLeapYear(i)) 
            {
                timestamp += LEAP_YEAR_IN_SECONDS;
            }
            else 
            {
                timestamp += YEAR_IN_SECONDS;
            }
        }
        uint8[12] memory monthDayCounts;
        monthDayCounts[0] = 31;
        if (isLeapYear(year)) 
        {
            monthDayCounts[1] = 29;
        }
        else 
        {
            monthDayCounts[1] = 28;
        }
        monthDayCounts[2] = 31;
        monthDayCounts[3] = 30;
        monthDayCounts[4] = 31;
        monthDayCounts[5] = 30;
        monthDayCounts[6] = 31;
        monthDayCounts[7] = 31;
        monthDayCounts[8] = 30;
        monthDayCounts[9] = 31;
        monthDayCounts[10] = 30;
        monthDayCounts[11] = 31;
        for (i = 1; i < month; i++) 
        {
            timestamp += DAY_IN_SECONDS * monthDayCounts[i - 1];
        }
        timestamp += DAY_IN_SECONDS * (day - 1);
        return timestamp;
    }
}
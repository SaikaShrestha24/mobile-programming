function calculate(operator)
{
    let n1 =
    Number(document.getElementById("n1").value);

    let n2 =
    Number(document.getElementById("n2").value);

    let answer;

    
    if(operator == "+")
    {
        answer = n1 + n2;
    }

    else if(operator == "-")
    {
        answer = n1 - n2;
    }

    else if(operator == "*")
    {
        answer = n1 * n2;
    }

    else if(operator == "/")
    {
        answer = n1 / n2;
    }

    
    document.getElementById("result").innerHTML =
    "Result = " + answer;
}
# Permissions List 

 <table>
    <thead>
        <tr>
            <th> Modules </th>
            <th> Contract Name </th>
            <th> Functions </th>
            <th> Current Permissions </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan=4> Checkpoint </td>
            <td rowspan=2>ERC20DividendCheckpoint</td>
            <td>pushDividendPayment()</td>
            <td rowspan=4> withPerm(DISTRIBUTE)</td>
        </tr>
        <tr>
            <td>pushDividendPaymentToAddresses()</td>
        </tr>
        <tr>
            <td rowspan=2>EtherDividendCheckpoint</td>
            <td>pushDividendPayment()</td>
        </tr>
        <tr>
            <td>pushDividendPaymentToAddresses()</td>
        </tr>
         <tr>
            <td> PermissionManager </td>
            <td>GeneralPermissionManager</td>
            <td>addPermission()</td>
            <td> withPerm(CHANGE_PERMISSION)</td>
        </tr>
        <tr>
            <td rowspan=4>STO</td>
            <td>CappedSTO</td>
            <td> - </td>
             <td> - </td>
        </tr>
        <tr>
            <td>DummySTO</td>
            <td> - </td>
            <td> - </td>
        </tr>
        <tr>
            <td rowspan=2>PreSaleSTO</td>
            <td>allocateTokens()</td>
            <td rowspan=2>withPerm(PRE_SALE_ADMIN)</td>
        </tr>
        <tr>
            <td>allocateTokensMulti()</td>
        </tr>
        <tr>
            <td rowspan=14>TransferManager</td>
            <td>CountTransferManager</td>
            <td>changeHolderCount()</td>
            <td>withPerm(ADMIN)</td>
        </tr>
         <tr>
            <td rowspan=8>GeneralTransferManager</td>
            <td>changeIssuanceAddress()</td>
            <td rowspan=6>withPerm(FLAGS)</td>
        </tr>
         <tr>
            <td>changeSigningAddress()</td>
        </tr>
        <tr>
            <td>changeAllowAllTransfers()</td>
        </tr>
        <tr>
            <td>changeAllowAllWhitelistTransfers()</td>
        </tr>
        <tr>
            <td>changeAllowAllWhitelistIssuances()</td>
        </tr>
        <tr>
            <td>changeAllowAllBurnTransfers()</td>
        </tr>
        <tr>
            <td>modifyWhitelist()</td>
            <td rowspan=2>withPerm(WHITELIST)</td>
        </tr>
        <tr>
            <td>modifyWhitelistMulti()</td>
        </tr>
        <tr>
          <td rowspan=4>ManualApprovalTransferManager</td>
          <td>addManualApproval()</td>
          <td rowspan=4>withPerm(TRANSFER_APPROVAL)</td>
        </tr>
        <tr>
          <td>addManualBlocking()</td>
        </tr>
        <tr>
          <td>revokeManualApproval()</td>
        </tr>
        <tr>
          <td>revokeManualBlocking()</td>
        </tr>
        <tr>
          <td>PercentageTransferManager</td>
          <td>modifyWhitelist()</td>
          <td>withPerm(WHITELIST)</td>
        </tr>
    </tbody>
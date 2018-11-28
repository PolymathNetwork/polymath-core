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
            <td rowspan=24> Checkpoint </td>
            <td rowspan=12>ERC20DividendCheckpoint</td>
            <td>pushDividendPayment()</td>
            <td rowspan=2> withPerm(DISTRIBUTE)</td>
        </tr>
        <tr>
            <td>pushDividendPaymentToAddresses()</td>
        </tr>
        <tr>
            <td> setDefaultExcluded() </td>
            <td rowspan=9> withPerm(MANAGE) </td>
        </tr>
        <tr>
            <td> setWithholding() </td>
        </tr>
        <tr>
            <td> setWithholdingFixed() </td>
        </tr>
        <tr>
            <td> createDividend() </td>
        </tr>
        <tr>
            <td> createDividendWithCheckpoint() </td>
        </tr>
        <tr>
            <td> createDividendWithExclusions() </td>
        </tr>
        <tr>
            <td> createDividendWithCheckpointAndExclusions() </td>
        </tr>
        <tr>
            <td> reclaimDividend() </td>
        </tr>
        <tr>
            <td> withdrawWithholding() </td>
        </tr>
        </tr>
            <td> createCheckpoint() </td>
            <td> withPerm(CHECKPOINT) </td>
        </tr>
        <tr>
            <td rowspan=12>EtherDividendCheckpoint</td>
            <td>pushDividendPayment()</td>
            <td rowspan=2> withPerm(DISTRIBUTE) </td>
        </tr>
        <tr>
            <td>pushDividendPaymentToAddresses()</td>
        </tr>
        <tr>
            <td> setDefaultExcluded() </td>
            <td rowspan=9> withPerm(MANAGE) </td>
        </tr>
        <tr>
            <td> setWithholding() </td>
        </tr>
        <tr>
            <td> setWithholdingFixed() </td>
        </tr>
        <tr>
            <td> createDividend() </td>
        </tr>
        <tr>
            <td> createDividendWithCheckpoint() </td>
        </tr>
        <tr>
            <td> createDividendWithExclusions() </td>
        </tr>
        <tr>
            <td> createDividendWithCheckpointAndExclusions() </td>
        </tr>
        <tr>
            <td> reclaimDividend() </td>
        </tr>
        <tr>
            <td> withdrawWithholding() </td>
        </tr>
        </tr>
            <td> createCheckpoint() </td>
            <td> withPerm(CHECKPOINT) </td>
        </tr>
         <tr>
            <td rowspan=3> PermissionManager </td>
            <td rowspan=3>GeneralPermissionManager</td>
            <td>addDelegate()</td>
            <td rowspan=3> withPerm(CHANGE_PERMISSION)</td>
        </tr>
        <tr>
            <td> changePermission() </td>
        </tr>
        <tr>
            <td> changePermissionMulti() </td>
        </tr>
        <tr>
            <td rowspan=10>STO</td>
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
            <td rowspan=6> USDTieredSTO </td>
            <td> modifyFunding() </td>
            <td rowspan=6> onlyOwner </td>
        </tr>
        <tr>
            <td> modifyLimits() </td>
        </tr>
        <tr>
            <td> modifyTiers() </td>
        </tr>
        <tr>
            <td> modifyAddresses() </td>
        </tr>
        <tr>
            <td> finalize() </td>
        </tr>
        <tr>
            <td> changeAccredited() </td>
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
            <td rowspan=39>TransferManager</td>
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
          <td rowspan=4>PercentageTransferManager</td>
          <td>modifyWhitelist()</td>
          <td rowspan=2>withPerm(WHITELIST)</td>
        </tr>
        <tr>
            <td> modifyWhitelistMulti() </td>
        </tr>
        <tr>
            <td> setAllowPrimaryIssuance() </td>
            <td rowspan=2> withPerm(ADMIN) </td>
        </tr>
        <tr>
            <td> changeHolderPercentage() </td>
        </tr>
        <tr>
            <td rowspan=4> LockupVolumeRestrictionTM</td>
            <td>addLockup()</td>
            <td rowspan=4> withPerm(ADMIN) </td>
        </tr>
        <tr>
            <td> addLockUpMulti() </td>
        </tr>
        <tr>
            <td> removeLockUp() </td>
        </tr>
        <tr>
            <td> modifyLockUp() </td>
        </tr>
        <tr>
            <td rowspan=17> SingleTradeVolumeRestrictionTM </td>
            <td> setAllowPrimaryIssuance() </td>
            <td rowspan=17> withPerm(ADMIN) </td>
        </tr>
        <tr>
            <td>changeTransferLimitToPercentage()</td>
        </tr>
        <tr>
            <td>changeTransferLimitToTokens()</td>
        </tr>
        <tr>
            <td>changeGlobalLimitInTokens()</td>
        </tr>
        <tr>
            <td>changeGlobalLimitInPercentage()</td>
        </tr>
        <tr>
            <td>addExemptWallet()</td>
        </tr>
        <tr>
            <td>removeExemptWallet()</td>
        </tr>
        <tr>
            <td>addExemptWalletMulti()</td>
        </tr>
        <tr>
            <td>removeExemptWalletMulti()</td>
        </tr>
        <tr>
            <td>setTransferLimitInTokens()</td>
        </tr>
        <tr>
            <td>setTransferLimitInPercentage()</td>
        </tr>
        <tr>
            <td>removeTransferLimitInPercentage()</td>
        </tr>
        <tr>
            <td>removeTransferLimitInTokens()</td>
        </tr>
        <tr>
            <td>setTransferLimitInTokensMulti()</td>
        </tr>
        <tr>
            <td>setTransferLimitInPercentageMulti()</td>
        </tr>
        <tr>
            <td>removeTransferLimitInTokensMulti()</td>
        </tr>
        <tr>
            <td> removeTransferLimitInPercentageMulti </td>
        </tr>
         <tr>
            <td rowspan=16>Wallet</td>
            <td rowspan=16>VestingEscrowWallet</td>
            <td>depositTokens()</td>
            <td rowspan=16>withPerm(ADMIN)</td>
        </tr>
        <tr>
            <td>sendToTreasury()</td>
        </tr>
        <tr>
            <td>pushAvailableTokens()</td>
        </tr>
        <tr>
            <td>addTemplate()</td>
        </tr>
        <tr>
            <td>removeTemplate()</td>
        </tr>
        <tr>
            <td>addSchedule()</td>
        </tr>
        <tr>
            <td>addScheduleFromTemplate()</td>
        </tr>
        <tr>
            <td>modifySchedule()</td>
        </tr>
        <tr>
            <td>revokeSchedule()</td>
        </tr>
        <tr>
            <td>revokeAllSchedules()</td>
        </tr>
        <tr>
            <td>trimBeneficiaries()</td>
        </tr>
        <tr>
            <td>pushAvailableTokensMulti()</td>
        </tr>
        <tr>
            <td>addScheduleMulti()</td>
        </tr>
        <tr>
            <td>addScheduleFromTemplateMulti()</td>
        </tr>
        <tr>
            <td>revokeSchedulesMulti()</td>
        </tr>
        <tr>
            <td>modifyScheduleMulti()</td>
        </tr>                                                                                                        
    </tbody>
 </table>
 
 ## Permissions on supporting contracts
 
 <table>
    <thead>
        <tr>
            <th> Contract Name </th>
            <th> Functions </th>
            <th> Current Permissions </th>
        </tr>
    </thead>
    <tbody>
     <tr>
      <td rowspan=13> PolyOracle </td>
      <td> schedulePriceUpdatesFixed() </td>
      <td rowspan=3> isAdminOrOwner </td>
    <tr>
      <td> schedulePriceUpdatesRolling() </td>
    <tr>
      <td> setGasLimit() </td>
    <tr> 
      <td> setPOLYUSD() </td>
     <td rowspan=9> onlyOwner </td>
    <tr>
      <td> setFreezeOracle() </td>
    <tr>
      <td> setOracleURL() </td>
    <tr> 
      <td> setSanityBounds() </td>
    <tr>
      <td> setGasPrice() </td>
    <tr>
      <td> setStaleTime() </td>
    <tr>
      <td> setIgnoreRequestIds() </td>
    <tr>
      <td> setAdmin() </td>
    <tr> 
      <td> setOraclizeTimeTolerance() </td> 
    <tr>
   </tr>
   <tr>
      <td rowspan=2> MakerDAOOracle </td>
      <td> setManualPrice() </td>
      <td rowspan=2> onlyOwner </td>
    <tr>
       <td> setManualOverride() </td>
     <tr>
   </tr>
  </tbody>
 </table>
 
 




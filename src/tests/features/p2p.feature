Feature: P2P Feature

    Scenario: User can access P2P trading interface
        Given The user already logged in to the Binance website
        When The user hovers the TRADE header menu item
        And The user clicks the "P2P" sub item
        Then The following tabs are displayed
        | tabs |
        | Buy  |
        | Sell |
        When The user selects "MMK" for currency, enters "Transaction amount" for amount and selects for payment
        Then The user saves the very first shown "MMK" buy and sell rate in database
        When The user selects "VND" for currency, enters "Transaction amount" for amount and selects for payment
        Then The user saves the very first shown "VND" buy and sell rate in database
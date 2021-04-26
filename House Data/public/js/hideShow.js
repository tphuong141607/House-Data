/* eslint-disable no-undef */
/* eslint-disable prettier/prettier */

$(document).ready(() => { 
    $('input.population').click(function () {
        if ($(this).is(':checked')) {
          $('.graph-Population').hide();
        } else if ($(this).is(':not(:checked)')) {
          $('.graph-Population').show();
        }
    });

    $('input.medianAge').click(function () {
        if ($(this).is(':checked')) {
          $('.graph-Median-Age').hide();
        } else if ($(this).is(':not(:checked)')) {
          $('.graph-Median-Age').show();
        }
    });

    $('input.medianEarnings').click(function () {
        if ($(this).is(':checked')) {
          $('.graph-Median-Earnings').hide();
        } else if ($(this).is(':not(:checked)')) {
          $('.graph-Median-Earnings').show();
        }
    });

    $('input.employment').click(function () {
        if ($(this).is(':checked')) {
          $('.graph-Employment').hide();
        } else if ($(this).is(':not(:checked)')) {
          $('.graph-Employment').show();
        }
    });

    $('input.unemployment').click(function () {
        if ($(this).is(':checked')) {
          $('.graph-Unemployment-Rate').hide();
        } else if ($(this).is(':not(:checked)')) {
          $('.graph-Unemployment-Rate').show();
        }
    });

    $('input.povertyRate').click(function () {
        if ($(this).is(':checked')) {
          $('.graph-Poverty').hide();
        } else if ($(this).is(':not(:checked)')) {
          $('.graph-Poverty').show();
        }
    });


    $('input.crime').click(function () {
        if ($(this).is(':checked')) {
          $('.graph-Crime').hide();
        } else if ($(this).is(':not(:checked)')) {
          $('.graph-Crime').show();
        }
    });
});


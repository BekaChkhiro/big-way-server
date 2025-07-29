# Auto-Renewal Functionality Setup Guide

This guide explains how to set up and use the auto-renewal functionality for cars and parts in the Big Way marketplace.

## Overview

The auto-renewal feature automatically refreshes the `created_at` date of cars and parts listings to keep them appearing fresh in search results. Users can purchase auto-renewal as an additional service when buying VIP status.

## Database Setup

### 1. Run Database Migrations

Execute these migration files in order:

```sql
-- 1. Add auto-renewal columns to cars table
\i database/migrations/add_auto_renewal_to_cars.sql

-- 2. Add auto-renewal columns to parts table  
\i database/migrations/add_auto_renewal_to_parts.sql
```

### 2. Database Schema

The auto-renewal functionality adds these columns to both `cars` and `parts` tables:

- `auto_renewal_enabled` (BOOLEAN) - Whether auto-renewal is active
- `auto_renewal_days` (INTEGER) - How often to refresh (in days)
- `auto_renewal_expiration_date` (TIMESTAMP) - When the service expires
- `auto_renewal_last_processed` (TIMESTAMP) - Last renewal timestamp
- `auto_renewal_total_days` (INTEGER) - Total days purchased
- `auto_renewal_remaining_days` (INTEGER) - Days remaining

## How It Works

### 1. Purchase Process

When a user buys VIP status with auto-renewal:

1. User selects auto-renewal service with desired frequency (e.g., every 1-7 days)
2. System calculates total cost: VIP price + auto-renewal price
3. Balance is deducted and auto-renewal settings are saved
4. Auto-renewal expiration date is set based on purchased days

### 2. Daily Processing

The auto-renewal system runs daily to:

1. **Disable Expired Services**: Mark expired auto-renewals as inactive
2. **Process Active Renewals**: Update `created_at` dates for eligible listings
3. **Track Usage**: Record each renewal and update remaining days
4. **Log Results**: Create transaction records for tracking

### 3. Renewal Logic

A listing is eligible for renewal when:
- `auto_renewal_enabled = TRUE`
- `auto_renewal_expiration_date > NOW()`
- Last processed date + renewal frequency ≤ current date

## Setup Instructions

### 1. Install Dependencies

The auto-renewal feature uses existing dependencies. No additional packages needed.

### 2. Configure Scheduled Task

#### Option A: Cron Job (Linux/Mac)

Add to your crontab:

```bash
# Run auto-renewal every day at 3 AM
0 3 * * * cd /path/to/big-way-server && node src/scripts/runAutoRenewal.js >> logs/auto-renewal.log 2>&1
```

#### Option B: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 3:00 AM
4. Set action: Start program
   - Program: `node`
   - Arguments: `src/scripts/runAutoRenewal.js`
   - Start in: `C:\path\to\big-way-server`

#### Option C: Manual Execution

```bash
# Run the auto-renewal script manually
cd big-way-server
node src/scripts/runAutoRenewal.js
```

### 3. Test the Feature

#### API Endpoints (Admin Only)

```bash
# Get auto-renewal statistics
GET /api/auto-renewal/stats

# Manually trigger processing
POST /api/auto-renewal/process

# Disable expired auto-renewals
POST /api/auto-renewal/disable-expired

# Test functionality (development only)
GET /api/auto-renewal/test
```

#### Example Test Flow

1. Create a car/part with VIP status and auto-renewal
2. Check database for auto-renewal settings
3. Run manual processing: `POST /api/auto-renewal/process`
4. Verify `created_at` date was updated

## Pricing Configuration

Auto-renewal pricing is configured in the VIP pricing service:

```javascript
// Current default: 0.5 GEL per day
const autoRenewalPrice = 0.5; // per day
```

## Monitoring and Maintenance

### 1. Log Files

Auto-renewal creates detailed logs:
- Processing results
- Renewal counts
- Error details
- Performance metrics

### 2. Database Queries

Monitor auto-renewal usage:

```sql
-- Active auto-renewals count
SELECT 
  'cars' as type,
  COUNT(*) as active_renewals
FROM cars 
WHERE auto_renewal_enabled = TRUE 
  AND auto_renewal_expiration_date > NOW()

UNION ALL

SELECT 
  'parts' as type,
  COUNT(*) as active_renewals
FROM parts 
WHERE auto_renewal_enabled = TRUE 
  AND auto_renewal_expiration_date > NOW();

-- Renewal activity today
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM balance_transactions
WHERE DATE(created_at) = CURRENT_DATE
  AND transaction_type IN ('auto_renewal_car', 'auto_renewal_part')
GROUP BY transaction_type;
```

### 3. Performance Optimization

For large datasets:
- Index on auto-renewal columns (already created)
- Monitor processing time
- Consider batch processing limits

## Troubleshooting

### Common Issues

1. **Script Not Running**
   - Check cron job configuration
   - Verify Node.js path
   - Check file permissions

2. **Database Errors**
   - Ensure migrations were run
   - Check database connection
   - Verify user permissions

3. **No Renewals Processed**
   - Check auto-renewal expiration dates
   - Verify renewal frequency logic
   - Review error logs

### Debug Commands

```bash
# Test database connection
node -e "require('./config/db.config').pg.query('SELECT NOW()', (err, res) => { console.log(err || res.rows[0]); process.exit(); })"

# Check auto-renewal stats
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:5000/api/auto-renewal/stats

# Manual processing
curl -X POST -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:5000/api/auto-renewal/process
```

## Security Considerations

1. **Admin Only**: Auto-renewal management is restricted to admin users
2. **Rate Limiting**: Consider adding rate limits for manual triggers
3. **Input Validation**: All dates and durations are validated
4. **Transaction Safety**: All operations use database transactions

## Future Enhancements

Potential improvements:
- Email notifications for renewals
- Different renewal frequencies per listing
- Bulk renewal management
- Analytics dashboard
- Custom renewal scheduling

## Support

For issues or questions:
1. Check the logs in `logs/auto-renewal.log`
2. Review database auto-renewal columns
3. Test with manual API calls
4. Contact development team
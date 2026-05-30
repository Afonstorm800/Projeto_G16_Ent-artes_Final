using System;
using System.Collections.Generic;

namespace EntArtes.Core.DTOs;

public class DashboardStatsDto
{
    public int Stat1 { get; set; }
    public int Stat2 { get; set; }
    public int Stat3 { get; set; }
    public int Stat4 { get; set; }
    public decimal? TotalValor { get; set; }
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty; // "Contribution", "Loan", "Session"
    public string Description { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Status { get; set; } = string.Empty;
}

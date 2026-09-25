using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class SystemSetting : BaseEntity
    {
        public string SettingKey { get; set; } = string.Empty; // VD: "DefaultMinThreshold"[cite: 3]
        public string SettingValue { get; set; } = string.Empty; // VD: "15"[cite: 3]
        public string Description { get; set; } = string.Empty; 
    }
}